const prisma = require("../config/db.config.js");
const { createQrCode } = require("../services/qr.service.js");

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

module.exports = {
    createQrCodeController
};