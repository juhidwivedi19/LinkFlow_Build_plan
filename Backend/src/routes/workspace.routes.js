const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware.js");
const { authorize } = require("../middlewares/rbac.middleware.js");

const {
    createWorkspaceController,
    getUserWorkspaceController,
    getWorkspaceController,
    updateWorkspaceController,
    deleteWorkspaceController,
    getWorkspaceMembersController,
    addWorkspaceMemberController,
    updateMemberRoleController,
    removeWorkspaceMemberController,
    leaveWorkspaceController
} = require("../controllers/workspace.controller.js");

const router = express.Router();

// Create workspace
router.post(
    "/",
    authMiddleware.authMiddleware,
    createWorkspaceController
);

// Get all workspaces of current user
router.get(
    "/",
    authMiddleware.authMiddleware,
    getUserWorkspaceController
);

// View a specific workspace
router.get(
    "/:workspaceId",
    authMiddleware.authMiddleware,
    authorize("VIEW_WORKSPACE"),
    getWorkspaceController
);

// Update workspace
router.patch(
    "/:workspaceId",
    authMiddleware.authMiddleware,
    updateWorkspaceController
);

// Delete workspace — OWNER only
router.delete(
    "/:workspaceId",
    authMiddleware.authMiddleware,
    authorize("DELETE_WORKSPACE"),
    deleteWorkspaceController
);

// View workspace members
router.get(
    "/:workspaceId/members",
    authMiddleware.authMiddleware,
    authorize("VIEW_WORKSPACE"),
    getWorkspaceMembersController
);

// Add team member — OWNER/ADMIN
router.post(
    "/:workspaceId/members",
    authMiddleware.authMiddleware,
    authorize("MANAGE_TEAM"),
    addWorkspaceMemberController
);

// Change member role — OWNER/ADMIN
router.patch(
    "/:workspaceId/members/:userId",
    authMiddleware.authMiddleware,
    authorize("CHANGE_ROLE"),
    updateMemberRoleController
);

// Remove member — OWNER/ADMIN
router.delete(
    "/:workspaceId/members/:userId",
    authMiddleware.authMiddleware,
    authorize("REMOVE_MEMBER"),
    removeWorkspaceMemberController
);

// Leave workspace
router.post(
    "/:workspaceId/leave",
    authMiddleware.authMiddleware,
    leaveWorkspaceController
);

module.exports = router;