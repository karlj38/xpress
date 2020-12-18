const express = require("express");
const issueRouter = express.Router({ mergeParams: true });
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

issueRouter.param("issueId", (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue where id = ${issueId}`, (err, row) => {
    if (err) {
      console.log(err);
      next(err);
    } else {
      if (row) {
        next();
      } else {
        res.sendStatus(404);
      }
    }
  });
});

const verifyIssue = (req, res, next) => {
  const issue = req.body.issue;
  if (
    issue.name &&
    issue.issueNumber &&
    issue.publicationDate &&
    issue.artistId
  ) {
    db.get(`SELECT * FROM Artist where id = ${issue.artistId}`, (err, row) => {
      if (err) {
        console.log(err);
        next(err);
      } else {
        if (row) {
          next();
        } else {
          res.sendStatus(404);
        }
      }
    });
  } else {
    res.sendStatus(400);
  }
};

issueRouter.get("/", (req, res, next) => {
  //   console.log(req.params);
  db.all(
    `SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
    (err, rows) => {
      if (err) {
        console.log(err);
        next(err);
      } else {
        res.status(200).send({ issues: rows });
      }
    }
  );
});

issueRouter.post("/", verifyIssue, (req, res, next) => {
  const issue = req.body.issue;
  db.run(
    "INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $number, $date, $artist, $series)",
    {
      $name: issue.name,
      $number: issue.issueNumber,
      $date: issue.publicationDate,
      $artist: issue.artistId,
      $series: req.params.seriesId,
    },
    function (err) {
      if (err) {
        console.log(err);
        next(err);
      } else {
        db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`, (err, row) => {
          res.status(201).send({ issue: row });
        });
      }
    }
  );
});

issueRouter.put("/:issueId", verifyIssue, (req, res, next) => {
  const issue = req.body.issue;
  db.run(
    `UPDATE Issue SET name = $name, issue_number = $number, publication_date = $date, artist_id = $artist, series_id = $series WHERE id = ${req.params.issueId}`,
    {
      $name: issue.name,
      $number: issue.issueNumber,
      $date: issue.publicationDate,
      $artist: issue.artistId,
      $series: req.params.seriesId,
    },
    function (err) {
      if (err) {
        console.log(err);
        next(err);
      } else {
        db.get(
          `SELECT * FROM Issue WHERE id = ${req.params.issueId}`,
          (err, row) => {
            res.status(200).send({ issue: row });
          }
        );
      }
    }
  );
});

issueRouter.delete("/:issueId", (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`, (err) => {
    if (err) {
      console.log(err);
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = issueRouter;
