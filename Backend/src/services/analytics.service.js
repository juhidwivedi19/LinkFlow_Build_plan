const analyticsQueue = require("../queues/analytics.queue.js");
const crypto = require("crypto");

function hashIp(ipAddress) {
    if (!ipAddress) {
        return null;
    }

    // SHA-256 creates a one-way representation of the IP.
    // We store this value instead of the raw IP in PostgreSQL.
    return crypto
        .createHash("sha256")
        .update(ipAddress)
        .digest("hex");
}

async function createAnalyticsEvent({
    linkId,
    ipAddress,
    userAgent,
    referrer
}) {
    try {
        await analyticsQueue.add("link-click", {
            eventId: crypto.randomUUID(),
            linkId,

            // Raw IP is passed only to the worker for GeoIP lookup.
            // It is NOT stored in AnalyticsEvent.
            ipAddress,

            // Hashed IP is the value that will actually be persisted.
            hashedIp: hashIp(ipAddress),

            userAgent,
            referrer,
            occurredAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error("Analytics event queue error:", error);
        return false;
    }
}

module.exports = {
    createAnalyticsEvent
};