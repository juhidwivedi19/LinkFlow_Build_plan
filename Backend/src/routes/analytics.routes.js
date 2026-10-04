const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware.js");

const {
    getLinkAnalyticsController
} = require("../controllers/analytics.controller.js");

const router = express.Router();

// Protected route: only authenticated users can access analytics.
router.get(
    "/links/:linkId/analytics",
    authMiddleware.authMiddleware,
    getLinkAnalyticsController
);

module.exports = router;