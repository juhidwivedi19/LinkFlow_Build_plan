
const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware.js");
const { authorize } = require("../middlewares/rbac.middleware.js");
const rateLimit = require("../middlewares/rateLimit.middleware.js");

const {
  createLinkController,
  getWorkspaceLinksController,
  getLinkController,
  updateLinkController,
  deleteLinkController,
} = require("../controllers/link.controller.js");

const router = express.Router();

// CREATE LINK
router.post(
  "/workspaces/:workspaceId/links",
  authMiddleware.authMiddleware,
  authorize("CREATE_LINK"),
  rateLimit({
    limit: 30,
    windowSeconds: 60,
    keyPrefix: "rate-limit:links:create",
  }),
  createLinkController
);

// GET ALL LINKS OF WORKSPACE
router.get(
  "/workspaces/:workspaceId/links",
  authMiddleware.authMiddleware,
  rateLimit({
    limit: 60,
    windowSeconds: 60,
    keyPrefix: "rate-limit:links:read",
  }),
  getWorkspaceLinksController
);

// GET SINGLE LINK
router.get(
  "/workspaces/:workspaceId/links/:linkId",
  authMiddleware.authMiddleware,
  rateLimit({
    limit: 60,
    windowSeconds: 60,
    keyPrefix: "rate-limit:links:read-single",
  }),
  getLinkController
);

// UPDATE LINK
router.patch(
  "/workspaces/:workspaceId/links/:linkId",
  authMiddleware.authMiddleware,
  authorize("EDIT_LINK"),
  rateLimit({
    limit: 30,
    windowSeconds: 60,
    keyPrefix: "rate-limit:links:update",
  }),
  updateLinkController
);

// DELETE LINK
router.delete(
  "/workspaces/:workspaceId/links/:linkId",
  authMiddleware.authMiddleware,
  authorize("DELETE_LINK"),
  rateLimit({
    limit: 20,
    windowSeconds: 60,
    keyPrefix: "rate-limit:links:delete",
  }),
  deleteLinkController
);

module.exports = router;

