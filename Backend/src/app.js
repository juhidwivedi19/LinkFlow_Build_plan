const express = require("express");

const app=express();
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const workspaceRouter = require("./routes/workspace.routes.js");
const linkRouter = require("./routes/link.routes.js");
const redirectRouter = require("./routes/redirect.routes.js");
const analyticsRouter = require("./routes/analytics.routes.js");
const dashboardRouter = require("./routes/dashboard.routes.js");

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/redirect", redirectRouter);
app.use("/api", linkRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/analytics", dashboardRouter);

module.exports = app;