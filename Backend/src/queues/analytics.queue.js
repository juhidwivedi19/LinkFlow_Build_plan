const { Queue } = require("bullmq");

const analyticsQueue = new Queue("analytics", {
    connection: {
        host: "localhost",
        port: 6380
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

module.exports = analyticsQueue;