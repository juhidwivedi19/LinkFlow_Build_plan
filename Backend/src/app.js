const express = require("express");

const app=express();
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const workspaceRouter = require("./routes/workspace.routes.js");
const linkRouter = require("./routes/link.routes.js");
const redirectRouter = require("./routes/redirect.routes.js");
const analyticsRouter = require("./routes/analytics.routes.js");
const dashboardRouter = require("./routes/dashboard.routes.js");
const qrRouter = require("./routes/qr.routes.js");
const customDomainRouter = require("./routes/custom-domain.routes.js");
const apiKeyRouter = require("./routes/apiKey.routes.js");
const externalLinkRouter = require("./routes/externalLink.routes");
const rateLimit = require("./middlewares/rateLimit.middleware");

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/redirect", redirectRouter);
app.use("/api", linkRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/analytics", dashboardRouter);
app.use("/api/qr", qrRouter);
app.use("/api", customDomainRouter);
app.use("/api", apiKeyRouter);
app.use("/api/external", externalLinkRouter);
app.use(
  rateLimit({
    limit: 100,
    windowSeconds: 60,
    keyPrefix: "rate-limit:global",
  })
);

module.exports = app;