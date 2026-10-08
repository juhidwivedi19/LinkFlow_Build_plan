const prisma = require("../config/db.config.js");
const qrQueue = require("../queues/qr.queue.js");
const { getDownloadUrl } = require("./storage.service.js");


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

    const existingQrCode = await prisma.qRCode.findUnique({
        where: {
            linkId
        }
    });

    // A completed or currently-processing QR can simply be reused.
    if (
        existingQrCode &&
        existingQrCode.status !== "FAILED"
    ) {
        return existingQrCode;
    }

    let qrCode;

    if (existingQrCode && existingQrCode.status === "FAILED") {

        // Reuse the existing record instead of creating duplicates.
        qrCode = await prisma.qRCode.update({
            where: {
                id: existingQrCode.id
            },
            data: {
                status: "PENDING",
                storageKey: null
            }
        });

    } else {

        // First QR generation for this link.
        qrCode = await prisma.qRCode.create({
            data: {
                linkId,
                status: "PENDING"
            }
        });
    }

    // Send generation/storage work to BullMQ.
    await qrQueue.add("generate-qr", {
        qrCodeId: qrCode.id,
        linkId
    });

    return qrCode;
}


// Generates a temporary URL for downloading the QR image.
async function getQrDownloadUrl(storageKey) {
    if (!storageKey) {
        throw new Error("QR storage key is missing");
    }

    return await getDownloadUrl(storageKey);
}


module.exports = {
    createQrCode,
    getQrDownloadUrl
};