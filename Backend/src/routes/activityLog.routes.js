const express = require("express");

const {
    getWorkspaceActivityLogsController
} = require("../controllers/activityLog.controller.js");

const {authMiddleware} = require("../middlewares/auth.middleware.js");

const router = express.Router();

// GET /api/workspaces/:workspaceId/activity-logs
router.get(
    "/:workspaceId/activity-logs",
    authMiddleware,
    getWorkspaceActivityLogsController
);

module.exports = router;