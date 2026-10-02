const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware.js");

const {
    createLinkController,
    getWorkspaceLinksController,
    getLinkController,
    updateLinkController,
    deleteLinkController
} = require("../controllers/link.controller.js");

const router = express.Router();


// CREATE LINK
router.post(
    "/workspaces/:workspaceId/links",
    authMiddleware.authMiddleware,
    createLinkController
);


// GET ALL LINKS OF WORKSPACE
router.get(
    "/workspaces/:workspaceId/links",
    authMiddleware.authMiddleware,
    getWorkspaceLinksController
);


// GET SINGLE LINK
router.get(
    "/workspaces/:workspaceId/links/:linkId",
    authMiddleware.authMiddleware,
    getLinkController
);


// UPDATE LINK
router.patch(
    "/workspaces/:workspaceId/links/:linkId",
    authMiddleware.authMiddleware,
    updateLinkController
);


// DELETE LINK
router.delete(
    "/workspaces/:workspaceId/links/:linkId",
    authMiddleware.authMiddleware,
    deleteLinkController
);


module.exports = router;