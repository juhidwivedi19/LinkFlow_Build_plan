const prisma = require("../config/db.config.js");

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
 * Weekly reports cover the previous Monday through Sunday.
 * Monthly reports cover the previous calendar month.
 */
async function getReportPeriod(reportType, referenceDate = new Date()) {
    if (
        !(referenceDate instanceof Date) ||
        Number.isNaN(referenceDate.getTime())
    ) {
        throw new Error("Invalid reference date");
    }

    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    if (reportType === "WEEKLY") {
        const daysSinceMonday = (referenceDate.getDay() + 6) % 7;

        start.setDate(referenceDate.getDate() - daysSinceMonday - 7);
        start.setHours(0, 0, 0, 0);

        end.setTime(start.getTime());
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (reportType === "MONTHLY") {
    // First day of the previous calendar month
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);

    // Last day of the previous calendar month
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
} else {
        throw new Error("Report type must be WEEKLY or MONTHLY");
    }

    return { start, end };
}

/**
 * Build a Prisma-compatible date filter.
 */
async function buildDateFilter(start, end) {
    return {
        occurredAt: {
            gte: start,
            lte: end
        }
    };
}

/**
 * Generate the analytics data for a workspace.
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
 * Escape a CSV field.
 */
function escapeCsvField(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Convert all report sections into CSV.
 */

   async function generateReportCsv(report) {
    if (
        !report ||
        !report.period ||
        !report.summary ||
        !Array.isArray(report.dailyClicks) ||
        !Array.isArray(report.topLinks) ||
        !report.breakdown ||
        !Array.isArray(report.breakdown.countries) ||
        !Array.isArray(report.breakdown.browsers) ||
        !Array.isArray(report.breakdown.devices) ||
        !Array.isArray(report.breakdown.referrers)
    ) {
        throw new Error("Invalid report data supplied for CSV generation");
    }
    const rows = [
        ["LinkFlow Analytics Report"],
        ["Workspace ID", report.workspaceId],
        ["Report Type", report.reportType],
        ["Period Start", report.period.start],
        ["Period End", report.period.end],
        ["Generated At", report.generatedAt],
        [],
        ["Summary"],
        ["Metric", "Value"],
        ["Total Clicks", report.summary.totalClicks],
        [],
        ["Daily Clicks"],
        ["Date", "Clicks"],
        ...report.dailyClicks.map((item) => [
            item.date,
            item.clicks
        ]),
        [],
        ["Top Links"],
        ["Link", "Clicks"],
        ...report.topLinks.map((item) => [
            item.title || item.shortCode || item.url || item.linkId || "Unknown",
            item.clicks
        ])
    ];

    const sections = [
        ["Countries", report.breakdown.countries],
        ["Browsers", report.breakdown.browsers],
        ["Devices", report.breakdown.devices],
        ["Referrers", report.breakdown.referrers]
    ];

    for (const [sectionName, items] of sections) {
        rows.push([], [sectionName], ["Name", "Clicks"]);

        for (const item of items) {
            rows.push([
                item.name ||
                    item.country ||
                    item.browser ||
                    item.device ||
                    item.referrer ||
                    "Unknown",
                item.clicks
            ]);
        }
    }

    return rows
        .map((row) => row.map(escapeCsvField).join(","))
        .join("\r\n");
}

/**
 * Save report metadata independently of CSV export.
 *
 * Requires Report.storageKey to be nullable in schema.prisma.
 */
async function saveReportMetadata(report, storageKey = null) {
    return prisma.report.create({
        data: {
            workspaceId: report.workspaceId,
            reportType: report.reportType,
            startDate: new Date(report.period.start),
            endDate: new Date(report.period.end),
            storageKey,
            status: storageKey ? "COMPLETED" : "GENERATED"
        }
    });
}

/**
 * Upload the CSV and return its metadata and temporary download URL.
 * This function does not create a second database record.
 */
async function exportReportCsv(report) {
    const csv = generateReportCsv(report);
    const buffer = Buffer.from(csv, "utf8");
    const suffix = crypto.randomUUID();

    const key =
        `reports/workspace-${report.workspaceId}/` +
        `${report.reportType.toLowerCase()}-${suffix}.csv`;

    await uploadFile(buffer, key, "text/csv");

    const downloadUrl = await getDownloadUrl(key);

    return {
        key,
        downloadUrl,
        expiresInSeconds: 900
    };
}

module.exports = {
    getReportPeriod,
    generateReport,
    generateReportCsv,
    saveReportMetadata,
    exportReportCsv
};