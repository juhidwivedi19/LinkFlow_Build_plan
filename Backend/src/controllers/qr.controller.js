const prisma = require("../config/db.config.js");
const { createQrCode, getQrDownloadUrl } = require("../services/qr.service.js");

async function createQrCodeController(req, res) {
    try {
        const { linkId } = req.params;

        if (!linkId || isNaN(Number(linkId))) {
            return res.status(400).json({
                message: "Valid linkId is required",
                status: "failed"
            });
        }

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

        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        const qrCode = await createQrCode(Number(linkId));

        return res.status(202).json({
            message: "QR code generation started",
            status: "success",
            data: qrCode
        });

    } catch (error) {
        console.error("Error creating QR code:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

async function downloadQrCodeController(req, res) {
    try {
        const { linkId } = req.params;

        if (!linkId || isNaN(Number(linkId))) {
            return res.status(400).json({
                message: "Valid linkId is required",
                status: "failed"
            });
        }

        // Verify that the user has access to this link through its workspace.
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

        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        const qrCode = await prisma.qRCode.findUnique({
            where: {
                linkId: Number(linkId)
            }
        });

        if (!qrCode) {
            return res.status(404).json({
                message: "QR code not found",
                status: "failed"
            });
        }

        if (qrCode.status !== "COMPLETED" || !qrCode.storageKey) {
            return res.status(409).json({
                message: "QR code is not ready for download",
                status: "failed"
            });
        }

        const downloadUrl = await getQrDownloadUrl(qrCode.storageKey);

        return res.status(200).json({
            message: "QR code download URL generated successfully",
            status: "success",
            data: {
                downloadUrl
            }
        });

    } catch (error) {
        console.error("Error generating QR download URL:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

module.exports = {
    createQrCodeController,
    downloadQrCodeController
};