const prisma = require("../config/db.config.js");

async function createNotification({
    userId,
    type,
    title,
    message,
    metadata = null,
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

    return tx.notification.create({
        data: {
            userId,
            type,
            title: title.trim(),
            message: message.trim(),
            metadata
        }
    });
}

module.exports = {
    createNotification
};