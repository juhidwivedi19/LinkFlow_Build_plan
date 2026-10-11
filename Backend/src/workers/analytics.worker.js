
const { Worker } = require("bullmq");

const prisma = require("../config/db.config.js");
const { getIO } = require("../config/socket.config.js");
const { deleteDashboardCache } = require("../services/redis.service.js");

const {
    getDevice,
    getBrowser,
    getOS
} = require("../utils/analytics.utils.js");

const { getLocation } = require("../utils/geo.utils.js");

console.log("Analytics worker started");

// Validate the analytics job before doing any expensive work.
function validateAnalyticsJob(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid analytics job payload");
    }

    const {
        eventId,
        linkId,
        occurredAt
    } = data;

    if (typeof eventId !== "string" || eventId.trim().length === 0) {
        throw new Error("Analytics job missing or invalid eventId");
    }

    if (!Number.isSafeInteger(linkId) || linkId <= 0) {
        throw new Error("Analytics job has an invalid linkId");
    }

    if (
        typeof occurredAt !== "string" ||
        Number.isNaN(Date.parse(occurredAt))
    ) {
        throw new Error("Analytics job has an invalid occurredAt");
    }
}

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

        validateAnalyticsJob(job.data);

        // Parse request metadata in the background.
        const device = getDevice(userAgent);
        const browser = getBrowser(userAgent);
        const os = getOS(userAgent);

        const { country, city } = getLocation(ipAddress);

        // Persist the event idempotently.
        // Retries with the same eventId won't create duplicate records.
        await prisma.analyticsEvent.upsert({
            where: {
                eventId
            },
            create: {
                eventId,
                linkId,
                hashedIp: hashedIp ?? null,
                userAgent: userAgent ?? null,
                referrer: referrer ?? null,
                country: country ?? null,
                city: city ?? null,
                device: device ?? null,
                browser: browser ?? null,
                os: os ?? null,
                occurredAt: new Date(occurredAt)
            },
            update: {}
        });

        // Find the workspace associated with this link.
        const link = await prisma.link.findUnique({
            where: {
                id: linkId
            },
            select: {
                id: true,
                workspaceId: true
            }
        });

        if (!link) {
            throw new Error(`Link ${linkId} not found after analytics persistence`);
        }

        // Invalidate cached dashboard statistics.
        // If invalidation fails, allow BullMQ to retry the job.
        await deleteDashboardCache(link.workspaceId);

        // Notify connected clients in the relevant workspace.
        // The frontend should refetch analytics instead of incrementing
        // displayed totals directly, so duplicate notifications are harmless.
        try {
            const io = getIO();

            io.to(`workspace:${link.workspaceId}`).emit(
                "dashboard:analytics-updated",
                {
                    workspaceId: link.workspaceId,
                    linkId: link.id,
                    eventId,
                    eventType: "link-click",
                    occurredAt
                }
            );
        } catch (error) {
            // Analytics are already persisted. Socket notification failure
            // should not cause the analytics job to be retried unnecessarily.
            console.error(
                "Dashboard socket notification error:",
                error.message
            );
        }

        console.log(
            `Analytics event ${eventId} processed for link ${linkId}`
        );

        return {
            success: true,
            eventId,
            linkId,
            workspaceId: link.workspaceId
        };
    },
    {
        connection: {
            host: "localhost",
            port: 6380
        },
        concurrency: 10
    }
);

// Log successful jobs.
analyticsWorker.on("completed", (job) => {
    console.log(`Analytics job ${job.id} completed`);
});

// Log failed jobs.
analyticsWorker.on("failed", (job, error) => {
    console.error(
        `Analytics job ${job?.id} failed:`,
        error.message
    );
});

// Handle worker-level errors.
analyticsWorker.on("error", (error) => {
    console.error("Analytics worker error:", error);
});

module.exports = analyticsWorker;

