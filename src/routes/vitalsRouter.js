const express = require("express");

const vitalsRouter = express.Router();
vitalsRouter.get("/livez", (_req, res) => {
  res.sendStatus(200);
});
vitalsRouter.get("/healthz", (_req, res) => {
  res.sendStatus(200);
});
module.exports = vitalsRouter;
