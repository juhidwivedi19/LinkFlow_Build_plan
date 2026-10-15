const { Worker } = require("bullmq");
const redis = require("../config/redis.config.js");
const reportQueue = require("../queues/report.queue.js");
const prisma = require("../config/db.config.js");

const {
generateReport,
exportReportCsv,
saveReportMetadata
} = require("../services/report.service.js");

const reportWorker = new Worker(
"report-generation",
async (job) => {
const { workspaceId, reportType, exportCsv = false } = job.data;


    // Handle scheduled weekly and monthly report jobs
    if (
        job.name === "generate-weekly-reports" ||
        job.name === "generate-monthly-reports"
    ) {
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

// Validate report type
if (!["WEEKLY", "MONTHLY"].includes(reportType)) {
    throw new Error("Report type must be WEEKLY or MONTHLY");
}

// Validate CSV option
if (typeof exportCsv !== "boolean") {
    throw new Error("exportCsv must be a boolean");
}

// Validate workspace ID
if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    throw new Error("A valid workspace ID is required");
}

// Generate report data
const report = await generateReport({
    workspaceId,
    reportType
});

// Optionally export the report as CSV
const csvExport = exportCsv
    ? await exportReportCsv(report)
    : null;

    // Save report history in the database
    const savedReport = await saveReportMetadata(
        report,
        csvExport?.key ?? null
    );

    return {
        workspaceId,
        reportType,
        reportId: savedReport.id,
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
