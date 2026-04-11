const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Routes Import
const userRouter = require('./src/routes/user.routes');

// Routes Declaration
app.use("/api/v1/users", userRouter);

module.exports = app;