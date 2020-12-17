const express = require("express");
const artistsRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

artistsRouter.param("artistId", (req, res, next, artistId) => {
  db.get(
    `SELECT * FROM Artist WHERE id = ${artistId}`,
    // { $artistId: artistId },
    function (err, row) {
      if (err) {
        console.log(err);
        next(err);
        //   res.sendStatus(500);
      } else if (row) {
        req.artist = row;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
});

const verifyArtist = (req, res, next) => {
  const artist = req.body.artist;
  if (artist.name && artist.dateOfBirth && artist.biography) {
    next();
  } else {
    res.sendStatus(400);
  }
};

artistsRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM Artist WHERE is_currently_employed = 1",
    (err, rows) => {
      if (err) {
        console.log(err);
        next(err);
        // res.sendStatus(500);
      }
      res.status(200).send({ artists: rows });
    }
  );
});

artistsRouter.get("/:artistId", (req, res, next) => {
  res.status(200).send({ artist: req.artist });
});

artistsRouter.post("/", verifyArtist, (req, res, next) => {
  const artist = req.body.artist;
  const isCurrentlyEmployed = artist.isCurrentlyEmployed === 0 ? 0 : 1;
  db.run(
    `INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)`,
    {
      $name: artist.name,
      $dateOfBirth: artist.dateOfBirth,
      $biography: artist.biography,
      $isCurrentlyEmployed: isCurrentlyEmployed,
    },
    function (err) {
      if (err) {
        console.log(err);
        next(err);
      }
      db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`, (err, row) => {
        if (err) {
          console.log(err);
          next(err);
        }
        res.status(201).send({ artist: row });
      });
    }
  );
});

artistsRouter.put("/:artistId", verifyArtist, (req, res, next) => {
  const artist = req.body.artist;
  db.run(
    `UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE id = $artistId`,
    {
      $name: artist.name,
      $dateOfBirth: artist.dateOfBirth,
      $biography: artist.biography,
      $isCurrentlyEmployed: artist.isCurrentlyEmployed,
      $artistId: req.params.artistId,
    },
    (err) => {
      if (err) {
        console.log(err);
        next(err);
      }
      db.get(
        `SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
        (err, row) => {
          if (err) {
            console.log(err);
            next(err);
          }
          res.status(200).send({ artist: row });
        }
      );
    }
  );
});

artistsRouter.delete("/:artistId", (req, res, next) => {
  db.get(
    `SELECT * FROM Artist WHERE id = ${req.params.artistId} `,
    (err, row) => {
      if (err) {
        console.log(err);
        next(err);
      }
      if (row) {
        db.run(
          `UPDATE Artist SET is_currently_employed = 0 WHERE id = ${req.params.artistId}`,
          function (err) {
            if (err) {
              console.log(err);
              next(err);
            }
            db.get(
              `SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
              (err, row) => {
                if (err) {
                  console.log(err);
                  next(err);
                }
                res.status(200).send({ artist: row });
              }
            );
          }
        );
      } else {
        res.sendStatus(404);
      }
    }
  );
});

module.exports = artistsRouter;
