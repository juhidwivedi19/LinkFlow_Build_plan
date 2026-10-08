const {Queue} = require("bullmq");

const qrQueue = new Queue("qr-generation", {
    connection: {
        host : "localhost",
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

module.exports = qrQueue;