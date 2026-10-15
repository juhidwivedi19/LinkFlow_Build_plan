const prisma = require("../config/db.config.js");
const { getDownloadUrl } = require("../services/storage.service.js");

const reportQueue = require("../queues/report.queue.js");

async function getReportsController(req, res) {
    try {
        const workspaceId = Number(req.query.workspaceId);
        const userId = Number(req.user?.id);

        // Validate workspace ID
        if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "A valid workspace ID is required"
            });
        }

        // Validate authenticated user
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Verify that the user belongs to this workspace
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId
                }
            },
            select: {
                id: true
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this workspace"
            });
        }

        // Retrieve report history
        const reports = await prisma.report.findMany({
            where: {
                workspaceId
            },
            orderBy: {
                createdAt: "desc"
            },
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

        return res.status(200).json({
            reports
        });
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
        const userId = Number(req.user?.id);

        // Validate report ID
        if (!Number.isInteger(reportId) || reportId <= 0) {
            return res.status(400).json({
                message: "A valid report ID is required"
            });
        }

        // Validate authenticated user
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Find the report
        const report = await prisma.report.findUnique({
            where: {
                id: reportId
            }
        });

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        // Verify that the user belongs to the report's workspace
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId: report.workspaceId
                }
            },
            select: {
                id: true
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this report"
            });
        }

        // Ensure the report is completed and has a stored file
        if (report.status !== "COMPLETED" || !report.storageKey) {
            return res.status(409).json({
                message: "Report is not ready for download"
            });
        }

        // Generate a temporary download URL
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


async function generateReportController(req, res) {
    try {
        const workspaceId = Number(req.body.workspaceId);
        const { reportType, exportCsv = false } = req.body;

        if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "A valid workspace ID is required"
            });
        }

        if (!["WEEKLY", "MONTHLY"].includes(reportType)) {
            return res.status(400).json({
                message: "Report type must be WEEKLY or MONTHLY"
            });
        }

        if (typeof exportCsv !== "boolean") {
            return res.status(400).json({
                message: "exportCsv must be a boolean"
            });
        }

        const userId = Number(req.user?.id);

if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({
        message: "Authentication required"
    });
}
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this workspace"
            });
        }

        const job = await reportQueue.add(
            "generate-workspace-report",
            {
                workspaceId,
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
        );

        return res.status(202).json({
            message: "Report generation queued successfully",
            jobId: job.id,
            workspaceId,
            reportType
        });
    } catch (error) {
        console.error("Generate report error:", error);

        return res.status(500).json({
            message: "Failed to queue report generation"
        });
    }
}

module.exports = {
    getReportsController,
    downloadReportController,
    generateReportController
};