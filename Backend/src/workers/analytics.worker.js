const { Worker } = require("bullmq");

const prisma = require("../config/db.config.js");
const { getCountry } = require("../utils/geo.utils.js");
const {
    getDevice,
    getBrowser,
    getOS
} = require("../utils/analytics.utils.js");

console.log("Analytics worker started");

const analyticsWorker = new Worker(
    "analytics",
    async (job) => {
        const {
            eventId,
            linkId,
            ipAddress,
            userAgent,
            referrer,
            occurredAt
        } = job.data;

        if (!linkId) {
    throw new Error("Analytics job missing linkId");
}

const device = getDevice(userAgent);
const browser = getBrowser(userAgent);
const os = getOS(userAgent);
const country = getCountry(ipAddress);

        await prisma.analyticsEvent.create({
            data: {
                eventId,
                linkId,
                ipAddress,
                userAgent,
                referrer,
                country,
                device,
                browser,
                os,
                  occurredAt: new Date(occurredAt)
            }
        });

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