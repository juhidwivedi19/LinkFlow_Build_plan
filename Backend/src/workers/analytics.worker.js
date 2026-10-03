const { Worker } = require("bullmq");

const prisma = require("../config/db.config.js");

console.log("Analytics worker started");

const analyticsWorker = new Worker(
    "analytics",
    async (job) => {
        const {
            linkId,
            ipAddress,
            userAgent,
            referrer
        } = job.data;


        await prisma.analyticsEvent.create({
            data: {
                linkId,
                ipAddress,
                userAgent,
                referrer
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