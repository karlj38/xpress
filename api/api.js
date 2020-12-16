const express = require("express");
const apiRouter = express.Router();
const artistsRouter = require("./artists");

apiRouter.use("/artists", artistsRouter);

module.exports = apiRouter;
