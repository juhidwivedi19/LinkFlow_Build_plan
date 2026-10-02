const express = require("express");

const app=express();
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const workspaceRouter = require("./routes/workspace.routes.js");
const linkRouter = require("./routes/link.routes.js");

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/links", linkRouter);

module.exports = app;