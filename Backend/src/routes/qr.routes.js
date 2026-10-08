const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware.js");
const { authorize } = require("../middlewares/rbac.middleware.js");
const {
    createQrCodeController,
    downloadQrCodeController
} = require("../controllers/qr.controller.js");

const router = express.Router();


router.post(
    "/workspaces/:workspaceId/links/:linkId/qr",
    authMiddleware.authMiddleware,
    authorize("GENERATE_QR"),
    createQrCodeController
);

router.get(
    "/workspaces/:workspaceId/links/:linkId/qr",
    authMiddleware.authMiddleware,
    authorize("GENERATE_QR"),
    downloadQrCodeController
);

module.exports = router;