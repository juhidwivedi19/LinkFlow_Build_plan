const prisma = require("../config/db.config");
const { hashApiKey } = require("../utils/apiKey.utils");

async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key is required",
      });
    }

    if (!apiKey.startsWith("lf_live_")) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    const keyHash = hashApiKey(apiKey);

    const storedApiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        workspace: true,
      },
    });

    if (!storedApiKey) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    if (storedApiKey.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "API key has been revoked",
      });
    }

    if (
      storedApiKey.expiresAt &&
      storedApiKey.expiresAt <= new Date()
    ) {
      return res.status(401).json({
        success: false,
        message: "API key has expired",
      });
    }

    req.apiKey = {
      id: storedApiKey.id,
      workspaceId: storedApiKey.workspaceId,
      permissions: storedApiKey.permissions,
    };

    // Update usage asynchronously so it doesn't delay the request.
    prisma.apiKey
      .update({
        where: { id: storedApiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((error) => {
        console.error("Failed to update API key usage:", error.message);
      });

    next();
  } catch (error) {
    console.error("API key authentication failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "API key authentication failed",
    });
  }
}

module.exports = { authenticateApiKey };

