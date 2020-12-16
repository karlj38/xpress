const express = require("express");
const cors = require("cors");
const errorHandler = require("errorhandler");
const morgan = require("morgan");
const apiRouter = require("./api/api");
const app = express();
const port = process.env.PORT || 4000;

app.use(express.static("./"));
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api", apiRouter);

app.use(errorHandler());

app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});

module.exports = app;
