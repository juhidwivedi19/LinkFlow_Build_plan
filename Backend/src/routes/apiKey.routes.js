const express = require("express");

const {
CreateApiKeyController,
GetApiKeysController,
RevokeApiKeyController,
} = require("../controllers/apiKey.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");

const router = express.Router();

// Create an API key
router.post(
"/workspaces/:workspaceId/api-keys",
authMiddleware,
authorize("MANAGE_TEAM"),
CreateApiKeyController
);

// List API keys
router.get(
"/workspaces/:workspaceId/api-keys",
authMiddleware,
authorize("MANAGE_TEAM"),
GetApiKeysController
);

// Revoke an API key
router.delete(
"/workspaces/:workspaceId/api-keys/:keyId",
authMiddleware,   //VERIFIES USER'S IDENTITY
authorize("MANAGE_TEAM"),//checks whether that user has permission to manage the specified workspace.
RevokeApiKeyController
);

module.exports = router;
