const express = require("express");


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
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.post(
    "/",
    authMiddleware.authMiddleware,
    createWorkspaceController
);

router.get(
    "/",
    authMiddleware.authMiddleware,
    getUserWorkspaceController
);
router.get(
    "/:workspaceId",
    authMiddleware.authMiddleware,
    getWorkspaceController
);
router.patch(
    "/:workspaceId",
    authMiddleware.authMiddleware,
    updateWorkspaceController
);
router.delete(
    "/:workspaceId",
    authMiddleware.authMiddleware,
    deleteWorkspaceController
);
router.get(
    "/:workspaceId/members",
    authMiddleware.authMiddleware,
    getWorkspaceMembersController
);
router.post(
    "/:workspaceId/members",
    authMiddleware.authMiddleware,
    addWorkspaceMemberController
);
router.patch(
    "/:workspaceId/members/:userId",
    authMiddleware.authMiddleware,
    updateMemberRoleController
);
router.delete(
    "/:workspaceId/members/:userId",
    authMiddleware.authMiddleware,
    removeWorkspaceMemberController
);
router.post(
    "/:workspaceId/leave",
    authMiddleware.authMiddleware,
    leaveWorkspaceController
);



module.exports = router;