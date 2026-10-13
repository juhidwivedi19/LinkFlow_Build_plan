

const linkExpirationQueue = require("../queues/linkExpiration.queue.js");

async function scheduleLinkExpirationJob() {
await linkExpirationQueue.upsertJobScheduler(
"link-expiration-scheduler",
{
every: 5 * 60 * 1000
},
{
name: "process-expired-links",
data: {}
}
);


console.log("Link expiration job scheduled to run every 5 minutes.");


}

module.exports = { scheduleLinkExpirationJob };
