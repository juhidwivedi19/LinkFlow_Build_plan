const prisma = require("../config/db.config.js");
const { getDownloadUrl } = require("../services/storage.service.js");

async function getReportsController(req, res) {
    try {
        const workspaceId = Number(req.query.workspaceId);

        if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "A valid workspace ID is required"
            });
        }

        // TODO: Verify the authenticated user belongs to this workspace
        // using your existing workspace authorization logic.

        const reports = await prisma.report.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                workspaceId: true,
                reportType: true,
                startDate: true,
                endDate: true,
                status: true,
                createdAt: true
            }
        });

        return res.status(200).json({ reports });
    } catch (error) {
        console.error("Get reports error:", error);
        return res.status(500).json({
            message: "Failed to retrieve reports"
        });
    }
}

async function downloadReportController(req, res) {
    try {
        const reportId = Number(req.params.reportId);

        if (!Number.isInteger(reportId) || reportId <= 0) {
            return res.status(400).json({
                message: "A valid report ID is required"
            });
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        // TODO: Verify the authenticated user can access report.workspaceId.

        if (report.status !== "COMPLETED") {
            return res.status(409).json({
                message: "Report is not ready for download"
            });
        }

        const downloadUrl = await getDownloadUrl(report.storageKey);

        return res.status(200).json({
            downloadUrl,
            expiresInSeconds: 900
        });
    } catch (error) {
        console.error("Download report error:", error);
        return res.status(500).json({
            message: "Failed to generate download link"
        });
    }
}

module.exports = {
    getReportsController,
    downloadReportController
};