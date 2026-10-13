
const prisma= require("../config/db.config.js");

const {
    getTotalClicksByWorkspace,
    getDailyClicksByWorkspace,
    getTopLinksByWorkspace,
    getClicksByCountryByWorkspace,
    getClicksByBrowserByWorkspace,
    getClicksByDeviceByWorkspace,
    getClicksByReferrerByWorkspace
} = require("../repositories/dashboard.repository.js");

const {
    uploadFile,
    getDownloadUrl
} = require("./storage.service.js");

const crypto = require("crypto");

/**
 * Calculate the reporting period for a weekly or monthly report.
 *
 * Weekly reports cover the previous Monday through Sunday.
 * Monthly reports cover the previous calendar month.
 *
 * Using explicit boundaries ensures that rerunning a report for the
 * same period doesn't accidentally include clicks from another period.
 */
function getReportPeriod(reportType, referenceDate = new Date()) {
    if (!(referenceDate instanceof Date) ||
        Number.isNaN(referenceDate.getTime())) {
        throw new Error("Invalid reference date");
    }

    const end = new Date(referenceDate);
    const start = new Date(referenceDate);

    // Normalize to local calendar boundaries.
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    if (reportType === "WEEKLY") {
        // JavaScript: Sunday = 0, Monday = 1, ..., Saturday = 6.
        // Calculate the most recent completed Monday-Sunday period.
        const daysSinceMonday = (referenceDate.getDay() + 6) % 7;

        start.setDate(referenceDate.getDate() - daysSinceMonday - 7);
        end.setTime(start.getTime());
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (reportType === "MONTHLY") {
        // Previous calendar month: first day through final day.
        start.setDate(1);
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);

        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else {
        throw new Error("Report type must be WEEKLY or MONTHLY");
    }

    return { start, end };
}

/**
 * Build a Prisma-compatible date filter for repository functions.
 *
 * The repository uses occurredAt.gte and occurredAt.lte to restrict
 * analytics events to the selected reporting period.
 */
function buildDateFilter(start, end) {
    return {
        occurredAt: {
            gte: start,
            lte: end
        }
    };
}

/**
 * Generate a workspace analytics report for a completed period.
 *
 * This function gathers data only. It does not schedule jobs or send
 * emails; those responsibilities belong to the scheduler and worker.
 */
async function generateReport({
    workspaceId,
    reportType,
    referenceDate = new Date()
}) {
    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
        throw new Error("A valid workspace ID is required");
    }

    const { start, end } = getReportPeriod(reportType, referenceDate);
    const dateFilter = buildDateFilter(start, end);

    // Run independent database aggregations concurrently to reduce
    // the time needed to assemble the report.
    const [
        totalClicks,
        dailyClicks,
        topLinks,
        countries,
        browsers,
        devices,
        referrers
    ] = await Promise.all([
        getTotalClicksByWorkspace(workspaceId, dateFilter),
        getDailyClicksByWorkspace(workspaceId, dateFilter),
        getTopLinksByWorkspace(workspaceId, dateFilter),
        getClicksByCountryByWorkspace(workspaceId, dateFilter),
        getClicksByBrowserByWorkspace(workspaceId, dateFilter),
        getClicksByDeviceByWorkspace(workspaceId, dateFilter),
        getClicksByReferrerByWorkspace(workspaceId, dateFilter)
    ]);

    return {
        workspaceId,
        reportType,
        period: {
            start: start.toISOString(),
            end: end.toISOString()
        },
        generatedAt: new Date().toISOString(),
        summary: {
            totalClicks
        },
        dailyClicks,
        topLinks,
        breakdown: {
            countries,
            browsers,
            devices,
            referrers
        }
    };
}

/**
 * Escape CSV fields so commas, quotes, and newlines don't break
 * the CSV structure.
 */
function escapeCsvField(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Convert a report's daily click totals into CSV.
 *
 * This produces a simple, spreadsheet-friendly export. More detailed
 * exports can be added later without changing report generation.
 */
function generateReportCsv(report) {
    const rows = [
        ["Date", "Clicks"],
        ...report.dailyClicks.map((item) => [
            item.date,
            item.clicks
        ])
    ];

    return rows
        .map((row) => row.map(escapeCsvField).join(","))
        .join("\r\n");
}

/**
 * Upload a CSV report to S3 and return a temporary download URL.
 *
 * The random suffix prevents different report generations from
 * overwriting one another. Access control must be enforced by the
 * API before returning the signed URL to a user.
 */

async function exportReportCsv(report) {
    const csv = generateReportCsv(report);
    const buffer = Buffer.from(csv, "utf8");
    const suffix = crypto.randomUUID();

    const key =
        `reports/workspace-${report.workspaceId}/` +
        `${report.reportType.toLowerCase()}-${suffix}.csv`;

    await uploadFile(buffer, key, "text/csv");

    const savedReport = await prisma.report.create({
        data: {
            workspaceId: report.workspaceId,
            reportType: report.reportType,
            startDate: new Date(report.period.start),
            endDate: new Date(report.period.end),
            storageKey: key,
            status: "COMPLETED"
        }
    });

    const downloadUrl = await getDownloadUrl(key);

    return {
        id: savedReport.id,
        key,
        downloadUrl,
        expiresInSeconds: 900
    };
}


module.exports = {
    getReportPeriod,
    generateReport,
    generateReportCsv,
    exportReportCsv
};
