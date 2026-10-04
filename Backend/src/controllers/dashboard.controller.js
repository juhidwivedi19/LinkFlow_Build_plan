const prisma = require("../config/db.config.js");

const {
    getWorkspaceDashboard
} = require("../services/dashboard.service.js");

async function getDashboardController(req, res) {
    try {
        const { workspaceId } = req.params;
        const { from, to } = req.query;

        if (!workspaceId || isNaN(Number(workspaceId))) {
            return res.status(400).json({
                message: "Valid workspaceId is required",
                status: "failed"
            });
        }

        // Verify that the authenticated user belongs to this workspace.
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: Number(workspaceId),
                memberships: {
                    some: {
                        userId: req.user.id
                    }
                }
            }
        });

        // Don't reveal whether another workspace exists.
        if (!workspace) {
            return res.status(404).json({
                message: "Workspace not found",
                status: "failed"
            });
        }

        const dashboard = await getWorkspaceDashboard(
            Number(workspaceId),
            from,
            to
        );

        return res.status(200).json({
            message: "Dashboard fetched successfully",
            status: "success",
            data: dashboard
        });

    } catch (error) {
        console.error("Error fetching dashboard:", error);

        // Date validation errors are client errors, not server errors.
        if (
            error.message === "Invalid from date" ||
            error.message === "Invalid to date" ||
            error.message === "Invalid date range"
        ) {
            return res.status(400).json({
                message: error.message,
                status: "failed"
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

module.exports = {
    getDashboardController
};