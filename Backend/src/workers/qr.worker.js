const { Worker } = require("bullmq");

const prisma = require("../config/db.config.js");
const { generateQrCode } = require("../utils/qr.utils.js");
const { uploadFile } = require("../services/storage.service.js");


const qrWorker = new Worker(
    "qr-generation",

    async (job) => {
        const { qrCodeId, linkId } = job.data;

        if (!qrCodeId || !linkId) {
            throw new Error("QR job is missing required data");
        }

        // Mark the QR as currently being processed.
        await prisma.qRCode.update({
            where: {
                id: qrCodeId
            },
            data: {
                status: "PROCESSING"
            }
        });

        try {
            const link = await prisma.link.findUnique({
                where: {
                    id: linkId
                },
                select: {
                    slug: true
                }
            });

            if (!link) {
                throw new Error("Link not found");
            }

            // QR points to the LinkFlow short URL.
            const shortUrl =
                `${process.env.BASE_URL || "http://localhost:4000"}/api/redirect/${link.slug}`;

            // Generate PNG image.
            const qrBuffer = await generateQrCode(shortUrl);

            // Store each link's QR under a predictable key.
            const storageKey = `qr-codes/${linkId}.png`;

            // Upload the QR image to private S3 storage.
            await uploadFile(
                qrBuffer,
                storageKey,
                "image/png"
            );

            // Generation and upload succeeded.
            await prisma.qRCode.update({
                where: {
                    id: qrCodeId
                },
                data: {
                    storageKey,
                    status: "COMPLETED"
                }
            });

            console.log(`QR code generated for link ${linkId}`);

        } catch (error) {
            // Mark the QR as failed so it does not remain stuck in PROCESSING.
            await prisma.qRCode.update({
                where: {
                    id: qrCodeId
                },
                data: {
                    status: "FAILED"
                }
            });

            // Re-throw so BullMQ can retry the job.
            throw error;
        }
    },

    {
        connection: {
            host: "localhost",
            port: 6380
        }
    }
);


qrWorker.on("completed", (job) => {
    console.log(`QR job ${job.id} completed`);
});


qrWorker.on("failed", (job, error) => {
    console.error(
        `QR job ${job?.id} failed:`,
        error
    );
});


qrWorker.on("error", (error) => {
    console.error("QR worker error:", error);
});


console.log("QR worker started");


module.exports = qrWorker;