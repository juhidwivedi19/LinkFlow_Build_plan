
const { Worker } = require("bullmq");
const  redis  = require("../config/redis.config.js");
const reportQueue = require("../queues/report.queue.js");
const prisma = require("../config/db.config.js");

const {
    generateReport,
    exportReportCsv
} = require("../services/report.service.js");

const reportWorker = new Worker(
    "report-generation",
    async (job) => {
        const { workspaceId, reportType, exportCsv = false } = job.data;

        if (job.name === "generate-weekly-reports" ||
            job.name === "generate-monthly-reports") {
            const workspaces = await prisma.workspace.findMany({
                select: { id: true }
            });

            await Promise.all(
                workspaces.map((workspace) =>
                    reportQueue.add(
                        "generate-workspace-report",
                        {
                            workspaceId: workspace.id,
                            reportType,
                            exportCsv
                        },
                        {
                            attempts: 3,
                            backoff: {
                                type: "exponential",
                                delay: 5000
                            }
                        }
                    )
                )
            );

            return {
                reportType,
                workspacesQueued: workspaces.length
            };
        }

        if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
            throw new Error("A valid workspace ID is required");
        }

        const report = await generateReport({
            workspaceId,
            reportType
        });

        const csvExport = exportCsv
            ? await exportReportCsv(report)
            : null;

        return {
            workspaceId,
            reportType,
            report,
            csvExport
        };
    },
    { connection: redis }
);

reportWorker.on("completed", (job) => {
    console.log(`Report job ${job.id} completed`);
});

reportWorker.on("failed", (job, error) => {
    console.error(`Report job ${job?.id} failed:`, error);
});

module.exports = reportWorker;

