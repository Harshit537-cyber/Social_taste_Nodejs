const express = require('express');
const cors = require('cors');
const postRouter = require('./src/routes/post.routes');
const userRouter = require('./src/routes/user.routes');

const app = express();


app.use(cors()); 
app.use(express.json());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);

module.exports = { app };