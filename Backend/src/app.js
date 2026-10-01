const express = require("express");

const app=express();
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const workspaceRouter = require("./routes/workspace.routes.js");
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);

module.exports = app;