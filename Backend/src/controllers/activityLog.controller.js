
const prisma = require("../config/db.config.js");

// GET WORKSPACE ACTIVITY LOGS
async function getWorkspaceActivityLogsController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        // Validate workspace ID
        if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        // Validate pagination parameters
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);

        if (
            !Number.isSafeInteger(page) ||
            page < 1 ||
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: "Page must be positive and limit must be between 1 and 100",
                status: "failed"
            });
        }

        // Optional action filter
        const action = req.query.action;

        if (
            action !== undefined &&
            (typeof action !== "string" || !action.trim())
        ) {
            return res.status(400).json({
                message: "Invalid action filter",
                status: "failed"
            });
        }

        // Optional entity-type filter
        const entityType = req.query.entityType;

        if (
            entityType !== undefined &&
            (typeof entityType !== "string" || !entityType.trim())
        ) {
            return res.status(400).json({
                message: "Invalid entity type filter",
                status: "failed"
            });
        }

        // Verify workspace membership
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
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        const skip = (page - 1) * limit;

        // Build activity filters
        const activityWhere = {
            workspaceId,
            ...(action ? { action: action.trim() } : {}),
            ...(entityType ? { entityType: entityType.trim() } : {})
        };

        // Retrieve activities and total count
        const [activities, total] = await prisma.$transaction([
            prisma.activityLog.findMany({
                where: activityWhere,
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" }
                ],
                skip,
                take: limit
            }),

            prisma.activityLog.count({
                where: activityWhere
            })
        ]);

        // Collect unique actor IDs, excluding null IDs
        const userIds = [
            ...new Set(
                activities
                    .map((activity) => activity.userId)
                    .filter((id) => id !== null)
            )
        ];

        // Fetch actor details for this page
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: {
                    id: {
                        in: userIds
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            })
            : [];

        // Create a lookup map for actor details
        const usersById = new Map(
            users.map((user) => [user.id, user])
        );

        // Attach actor information to each activity
        const activitiesWithActor = activities.map((activity) => ({
            ...activity,
            actor: activity.userId !== null
                ? usersById.get(activity.userId) ?? null
                : null
        }));

        return res.status(200).json({
            message: "Workspace activity retrieved successfully",
            status: "success",
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            filters: {
                action: action ? action.trim() : null,
                entityType: entityType ? entityType.trim() : null
            },
            activities: activitiesWithActor
        });

    } catch (error) {
        console.error("Get workspace activity logs error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

module.exports = {
    getWorkspaceActivityLogsController
};
