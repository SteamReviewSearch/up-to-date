const express = require("express");
const app = express();
const { error, error404 } = require("./middlewares/error/error");

app.use(error404);
app.use(error);
