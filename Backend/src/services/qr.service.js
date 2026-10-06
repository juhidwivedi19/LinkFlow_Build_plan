const prisma = require("../config/db.config.js");
const qrQueue = require("../queues/qr.queue.js");

async function createQrCode(linkId) {
    // Make sure the link exists before creating a QR record.
    const link = await prisma.link.findUnique({
        where: {
            id: linkId
        }
    });

    if (!link) {
        throw new Error("Link not found");
    }

    // Only one QR code is allowed for each link.
    const existingQrCode = await prisma.qRCode.findUnique({
        where: {
            linkId
        }
    });

    if (existingQrCode) {
        return existingQrCode;
    }

    // Create the QR record first so we can track its processing status.
    const qrCode = await prisma.qRCode.create({
        data: {
            linkId,
            status: "PENDING"
        }
    });

    // Send the actual QR generation/storage work to BullMQ.
    await qrQueue.add("generate-qr", {
        qrCodeId: qrCode.id,
        linkId
    });

    return qrCode;
}

module.exports = {
    createQrCode
};