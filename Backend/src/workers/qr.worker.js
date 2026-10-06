const {worker} = require("bullmq");

const qrWorker = new Worker(
    "qr-generation",
    async (job) => {
        console.log(`Processing QR job ${job.id}`);

        const {linkId} = job.data;

        if(!linkId) {
            throw new Error("QR job missing linkId");

        }
    // QR generation and storage will be added here in the next step.
        // For now, we only verify that the worker receives the job correctly.
        console.log(`QR job received for link ${linkId}`);
    },
    {
      connection: {
        host: "localhost",
        port: 6380
      }
    }
);

qrWorker.on("completed", (job) => {
    console.log(`QR job ${job.id} completed`);
});

qrWorker.on("failed", (job, error) => {
    console.error(`QR job ${job?.id} failed:`, error);
});

qrWorker.on("error", (error) => {
    console.error("QR worker error:", error);
});

console.log("QR worker started");

module.exports = qrWorker;