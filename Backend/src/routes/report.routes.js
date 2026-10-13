const express = require("express");

const {
    getReportsController,
    downloadReportController
} = require("../controllers/report.controller.js");

const router = express.Router();
const {authMiddleware} = require("../middlewares/auth.middleware.js");

router.get("/", authMiddleware, getReportsController);

router.get(
    "/:reportId/download",
    authMiddleware,
    downloadReportController
);

module.exports = router;