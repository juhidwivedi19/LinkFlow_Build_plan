const prisma = require("../config/db.config.js");

const {
    getLinkAnalytics
} = require("../services/analytics-query.service.js");

async function getLinkAnalyticsController(req, res) {
    try {
        const { linkId } = req.params;

        if (!linkId || isNaN(Number(linkId))) {
            return res.status(400).json({
                message: "Valid linkId is required",
                status: "failed"
            });
        }

        // Find the link and its workspace membership for the logged-in user.
        const link = await prisma.link.findFirst({
            where: {
                id: Number(linkId),
                workspace: {
                    memberships: {
                        some: {
                            userId: req.user.id
                        }
                    }
                }
            }
        });

        // Returning 404 avoids revealing whether another workspace's
        // link exists at all.
        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        const { page, limit, from, to } = req.query;

        const analytics = await getLinkAnalytics(
            Number(linkId),
            page,
            limit,
            from,
            to
        );

        return res.status(200).json({
            message: "Analytics fetched successfully",
            status: "success",
            data: analytics
        });

    }  catch (error) {
    console.error("Error fetching link analytics:", error);

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
    getLinkAnalyticsController
};