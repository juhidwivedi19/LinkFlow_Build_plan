const prisma = require("../config/db.config.js");

async function createNotification({
    userId,
    type,
    title,
    message,
    metadata = null,
    linkId = null,
    tx = prisma
}) {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error("Valid userId is required");
    }

    const allowedTypes = [
        "LINK_EXPIRATION",
        "TEAM_INVITATION",
        "DOMAIN_VERIFICATION",
        "PASSWORD_CHANGED"
    ];

    if (!allowedTypes.includes(type)) {
        throw new Error("Invalid notification type");
    }

    if (typeof title !== "string" || !title.trim()) {
        throw new Error("Notification title is required");
    }

    if (typeof message !== "string" || !message.trim()) {
        throw new Error("Notification message is required");
    }

    if (
        linkId !== null &&
        (!Number.isSafeInteger(linkId) || linkId <= 0)
    ) {
        throw new Error("linkId must be a positive integer or null");
    }

    return tx.notification.create({
        data: {
            userId,
            type,
            title: title.trim(),
            message: message.trim(),
            metadata,
            linkId
        }
    });
}

module.exports = {
    createNotification
};