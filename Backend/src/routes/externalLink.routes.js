const express = require("express");

const rateLimit = require("../middlewares/rateLimit.middleware.js")
const {
  createLinkController,
   getWorkspaceLinksController,
   deleteLinkController
} = require("../controllers/link.controller");

const {
  authenticateApiKey,
} = require("../middlewares/apiKey.middleware");

const {
  requireApiKeyPermission,
} = require("../middlewares/apiKeyPermission.middleware");

const router = express.Router();

// Create a short link using an API key
router.post(
  "/links",
  authenticateApiKey,
  requireApiKeyPermission("links:create"),
  createLinkController
);


// Get links accessible to the API key's workspace
router.get(
    "/links",
    authenticateApiKey,
    requireApiKeyPermission("links:read"),
    getWorkspaceLinksController
);


router.delete(
    "/links/:linkId",
    authenticateApiKey,
    requireApiKeyPermission("links:delete"),
    deleteLinkController
);


module.exports = router;