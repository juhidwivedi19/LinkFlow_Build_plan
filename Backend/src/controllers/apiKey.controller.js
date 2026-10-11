const prisma = require("../config/db.config");
const { createApiKeyService } = require("../services/apiKey.service");

// Create API Key
async function CreateApiKeyController(req, res) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const { name, permissions, expiresAt } = req.body;

    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const apiKey = await createApiKeyService({
      name,
      workspaceId,
      permissions,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      message: "API key created successfully. Save it now; it will not be shown again.",
      data: apiKey,
    });
  } catch (error) {
  console.error("Create API key error:", error.message);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode
      ? error.message
      : "Internal server error",
  });
}
}

// List API Keys
async function GetApiKeysController(req, res) {
  try {
    const workspaceId = Number(req.params.workspaceId);

    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error("List API keys error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve API keys",
    });
  }
}

// Revoke API Key
async function RevokeApiKeyController(req, res) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const keyId = Number(req.params.keyId);

    if (
      !Number.isInteger(workspaceId) ||
      workspaceId <= 0 ||
      !Number.isInteger(keyId) ||
      keyId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID or API key ID",
      });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        workspaceId,
      },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    if (apiKey.revokedAt) {
      return res.status(409).json({
        success: false,
        message: "API key is already revoked",
      });
    }

    await prisma.apiKey.updateMany({
  where: {
    id: keyId,
    workspaceId,
    revokedAt: null,
  },
  data: {
    revokedAt: new Date(),
  },
});

    return res.status(200).json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Revoke API key error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to revoke API key",
    });
  }
}

module.exports = {
  CreateApiKeyController,
  GetApiKeysController,
  RevokeApiKeyController,
};