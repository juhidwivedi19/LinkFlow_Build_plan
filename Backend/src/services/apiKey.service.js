
const prisma = require("../config/db.config");
const {
  generateApiKey,
  hashApiKey,
} = require("../utils/apiKey.utils");

async function createApiKeyService({
  name,
  workspaceId,
  permissions = [],
  expiresAt = null,
}) {
  if (!name || !name.trim()) {
   const error = new Error("API key name is required");
error.statusCode = 400;
throw error;
  }

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
   const error = new Error("A valid workspace ID is required");
error.statusCode = 400;
throw error;
  }

  const allowedPermissions = ["links:read", "links:create", "links:delete"];

  if (
  !Array.isArray(permissions) ||
  !permissions.every((permission) =>
    allowedPermissions.includes(permission)
  ) ||
  new Set(permissions).size !== permissions.length
) {
const error = new Error("Invalid API key permissions");
error.statusCode = 400;
throw error;
}

  if (expiresAt !== null) {
    const expirationDate = new Date(expiresAt);

    if (
      Number.isNaN(expirationDate.getTime()) ||
      expirationDate <= new Date()
    ) {
     const error = new Error("Expiration date must be in the future");
error.statusCode = 400;
throw error;
    }

    expiresAt = expirationDate;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });

  if (!workspace) {
     const error = new Error("Workspace not found");
error.statusCode = 404;
throw error;
  }

  const { apiKey, keyPrefix } = generateApiKey();
  const keyHash = hashApiKey(apiKey);

  const savedApiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      keyPrefix,
      keyHash,
      permissions,
      expiresAt,
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      expiresAt: true,
      createdAt: true,
      workspaceId: true,
    },
  });

  // Return the plaintext key only during creation.
  return {
    ...savedApiKey,
    apiKey,
  };
}

module.exports = {
  createApiKeyService,
};