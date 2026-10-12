const prisma = require("../config/db.config.js");

async function GetNotificationsController(req, res) {
    try {
        const userId = req.user.id;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            prisma.notification.count({
                where: { userId }
            }),
            prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications"
        });
    }
}

async function MarkNotificationAsReadController(req, res) {
    try {
        const userId = req.user.id;
        const notificationId = Number(req.params.id);

        if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        if (notification.isRead) {
            return res.status(200).json({
                success: true,
                message: "Notification is already marked as read",
                data: notification
            });
        }

        const updatedNotification = await prisma.notification.update({
            where: {
                id: notificationId
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: updatedNotification
        });
    } catch (error) {
        console.error("Mark notification as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read"
        });
    }
}

module.exports = {
    GetNotificationsController,
    MarkNotificationAsReadController
};