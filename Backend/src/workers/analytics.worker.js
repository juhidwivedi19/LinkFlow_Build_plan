const { Worker } = require("bullmq");
const { deleteDashboardCache } = require("../services/redis.service.js");
const prisma = require("../config/db.config.js");

const {
    getDevice,
    getBrowser,
    getOS
} = require("../utils/analytics.utils.js");

const { getLocation } = require("../utils/geo.utils.js");

console.log("Analytics worker started");

const analyticsWorker = new Worker(
    "analytics",
    async (job) => {
        const {
            eventId,
            linkId,
            ipAddress,
            hashedIp,
            userAgent,
            referrer,
            occurredAt
        } = job.data;

         // Validate required fields before processing the analytics event.
        // Throwing the error allows BullMQ to retry the failed job.
        if (!eventId) {
            throw new Error("Analytics job missing eventId");
        }

        if (!linkId) {
    throw new Error("Analytics job missing linkId");
}

// Convert the raw User-Agent into useful analytics fields.
const device = getDevice(userAgent);
const browser = getBrowser(userAgent);
const os = getOS(userAgent);


        // GeoIP lookup is performed inside the background worker,
        // so it does not slow down the user's redirect request.
        const { country, city } = getLocation(ipAddress);

        await prisma.analyticsEvent.create({
            data: {
                eventId,
                linkId,
                hashedIp,
                userAgent,
                referrer,
                country,
                city,
                device,
                browser,
                os,
                  occurredAt: new Date(occurredAt)
            }
        });

        // Find the workspace that owns this link.
const link = await prisma.link.findUnique({
    where: {
        id: linkId
    },
    select: {
        workspaceId: true
    }
});

if (link) {
    // New click changes dashboard statistics,
    // so invalidate the cached dashboard.
    try {
        await deleteDashboardCache(link.workspaceId);
    } catch (error) {
        console.error(
            "Dashboard cache invalidation error:",
            error
        );
    }
}
        console.log(
            `Analytics event processed for link ${linkId}`
        );
    },
    {
        connection: {
            host: "localhost",
            port: 6380
        }
    }
);

analyticsWorker.on("completed", (job) => {
    console.log(`Analytics job ${job.id} completed`);
});

analyticsWorker.on("failed", (job, error) => {
    console.error(
        `Analytics job ${job?.id} failed:`,
        error
    );
});

analyticsWorker.on("error", (error) => {
    console.error("Analytics worker error:", error);
});

module.exports = analyticsWorker;