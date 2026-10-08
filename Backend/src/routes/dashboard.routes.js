const express = require("express");


const authMiddleware = require("../middlewares/auth.middleware.js");
const { authorize } = require("../middlewares/rbac.middleware.js");
const {
    getDashboardController
} = require("../controllers/dashboard.controller.js");

const router = express.Router();

// Workspace dashboard is available only to authenticated users.
router.get(
    "/workspaces/:workspaceId/dashboard",
    authMiddleware.authMiddleware,
    authorize("VIEW_ANALYTICS"),
    getDashboardController
);
module.exports = router;