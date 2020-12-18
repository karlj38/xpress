const express = require("express");
const seriesRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);
const issueRouter = require("./issues");

seriesRouter.param("seriesId", (req, res, next, seriesId) => {
  db.get(`SELECT * FROM Series WHERE id = ${seriesId}`, function (err, row) {
    if (err) {
      console.log(err);
      next(err);
    } else if (row) {
      req.series = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

const verifySeries = (req, res, next) => {
  const series = req.body.series;
  if (series.name && series.description) {
    next();
  } else {
    res.sendStatus(400);
  }
};

seriesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Series;", (err, rows) => {
    if (err) {
      console.log(err);
      next(err);
    }
    res.status(200).send({ series: rows });
  });
});

seriesRouter.get("/:seriesId", (req, res, next) => {
  res.status(200).send({ series: req.series });
});

seriesRouter.post("/", verifySeries, (req, res, next) => {
  const series = req.body.series;
  db.run(
    `INSERT INTO Series (name, description) VALUES ($name, $description);`,
    { $name: series.name, $description: series.description },
    function (err) {
      if (err) {
        console.log(err);
        next(err);
      }
      db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, row) => {
        if (err) {
          console.log(err);
          next(err);
        }
        res.status(201).send({ series: row });
      });
    }
  );
});

seriesRouter.put("/:seriesId", verifySeries, (req, res, next) => {
  db.run(
    `UPDATE Series SET name = $name, description = $description WHERE Series.id = $id`,
    {
      $name: req.body.series.name,
      $description: req.body.series.description,
      $id: req.params.seriesId,
    },
    (err) => {
      if (err) {
        console.log(err);
        next(err);
      }
      db.get(
        `SELECT * FROM Series WHERE id = ${req.params.seriesId}`,
        (err, row) => {
          if (err) {
            console.log(err);
            next(err);
          } else {
            res.status(200).send({ series: row });
          }
        }
      );
    }
  );
});

seriesRouter.delete("/:seriesId", (req, res, next) => {
  db.get(
    `SELECT * FROM Issue where series_id = ${req.params.seriesId}`,
    (err, row) => {
      if (err) {
        console.log(err);
        next(err);
      } else {
        if (row) {
          res.sendStatus(400);
        } else {
          db.run(
            `DELETE FROM Series WHERE id = ${req.params.seriesId}`,
            (err) => {
              if (err) {
                console.log(err);
                next(err);
              } else {
                res.sendStatus(204);
              }
            }
          );
        }
      }
    }
  );
});

seriesRouter.use("/:seriesId/issues", issueRouter);

module.exports = seriesRouter;
