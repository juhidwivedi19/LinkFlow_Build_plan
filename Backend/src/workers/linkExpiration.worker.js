const { Worker } = require("bullmq");
const { processExpiredLinks } = require("../services/linkExpiration.service.js");

const linkExpirationWorker = new Worker(
"link-expiration",
async (job) => {
console.log(`Processing link expiration job: ${job.id}`);


const result = await processExpiredLinks();

console.log(
    `Link expiration job completed. Expired links found: ${result.expiredLinksFound}, notifications created: ${result.notificationsCreated}, notifications skipped: ${result.notificationsSkipped}`
);

return result;
},
{
    connection: {
        host: "localhost",
        port: 6380
    }
}


);

linkExpirationWorker.on("completed", (job) => {
console.log(`Link expiration worker completed job ${job.id}`);
});

linkExpirationWorker.on("failed", (job, error) => {
console.error(
`Link expiration job ${job?.id} failed:`,
error.message
);
});

module.exports = linkExpirationWorker;
