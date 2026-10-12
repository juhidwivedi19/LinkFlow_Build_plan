const express = require("express");
const router = express.Router();

const {
    GetNotificationsController,
    MarkNotificationAsReadController
} = require("../controllers/notification.controller.js");

const {authMiddleware} = require("../middlewares/auth.middleware.js");

router.get("/", authMiddleware, GetNotificationsController);
router.patch("/:id/read", authMiddleware, MarkNotificationAsReadController);

module.exports = router;