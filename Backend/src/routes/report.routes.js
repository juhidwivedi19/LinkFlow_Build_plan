const express = require("express");

const {
    getReportsController,
    downloadReportController,
    generateReportController
} = require("../controllers/report.controller.js");


const router = express.Router();
const {authMiddleware} = require("../middlewares/auth.middleware.js");

router.get("/", authMiddleware, getReportsController);

router.get(
    "/:reportId/download",
    authMiddleware,
    downloadReportController
);

router.post("/generate", authMiddleware, generateReportController);

module.exports = router;