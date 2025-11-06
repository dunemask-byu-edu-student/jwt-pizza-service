require('dotenv').config()
const app = require("./service.js");
require("./metrics.js");

// const express = require("express");
// const app = express();
// app.get("/healthz", (_, res) => res.sendStatus(200));
// app.get("/livez", (_, res) => res.sendStatus(200));


const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
