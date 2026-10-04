const analyticsQueue = require("../queues/analytics.queue.js");
const crypto = require("crypto");

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
    ipAddress,
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