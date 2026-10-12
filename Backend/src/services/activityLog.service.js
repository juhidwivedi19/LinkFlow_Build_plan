const prisma = require("../config/db.config.js");

async function createActivityLog({
    workspaceId,
    userId,
    action,
    entityType,
    entityId = null,
    metadata = null,
    tx = prisma
}) {
    if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
        throw new Error("Valid workspaceId is required");
    }

    if (userId !== null &&
        (!Number.isSafeInteger(userId) || userId <= 0)) {
        throw new Error("Valid userId is required");
    }

    if (typeof action !== "string" || !action.trim()) {
        throw new Error("Activity action is required");
    }

    if (typeof entityType !== "string" || !entityType.trim()) {
        throw new Error("Entity type is required");
    }

    return tx.activityLog.create({
        data: {
            workspaceId,
            userId,
            action,
            entityType,
            entityId,
            metadata
        }
    });
}

module.exports = {
    createActivityLog
};