const reportQueue = require("../queues/report.queue.js");

async function scheduleReports() {
    await reportQueue.upsertJobScheduler(
        "weekly-reports",
        { pattern: "0 0 * * 1" },
        {
            name: "generate-weekly-reports",
            data: {
                reportType: "WEEKLY",
                exportCsv: true
            },
            opts: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000
                }
            }
        }
    );

    await reportQueue.upsertJobScheduler(
        "monthly-reports",
        { pattern: "0 0 1 * *" },
        {
            name: "generate-monthly-reports",
            data: {
                reportType: "MONTHLY",
                exportCsv: true
            },
            opts: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000
                }
            }
        }
    );

    console.log("Weekly and monthly report schedules registered");
}

module.exports = { scheduleReports };