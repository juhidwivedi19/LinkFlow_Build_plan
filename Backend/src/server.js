
const http = require("http");
require("dotenv").config();

const app = require("./app.js");
const prisma = require("./config/db.config.js");
const redis = require("./config/redis.config.js");
const { initializeSocket } = require("./config/socket.config.js");

const analyticsWorker = require("./workers/analytics.worker.js");
const linkExpirationWorker = require("./workers/linkExpiration.worker.js");
const reportWorker = require("./workers/report.worker.js");
const qrWorker = require("./workers/qr.worker.js");

const linkExpirationQueue = require("./queues/linkExpiration.queue.js");
const reportQueue = require("./queues/report.queue.js");

const {
    scheduleLinkExpirationJob
} = require("./schedulers/linkExpiration.scheduler.js");

const {
    scheduleReports
} = require("./schedulers/report.scheduler.js");

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = initializeSocket(server);

let isShuttingDown = false;

async function startServer() {
    try {
        await scheduleLinkExpirationJob();
        await scheduleReports();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start LinkFlow:", error);
        await cleanupResources();
        process.exitCode = 1;
    }
}

async function cleanupResources() {
    try {
        await reportWorker.close();
    } catch (error) {
        console.error("Report worker cleanup error:", error.message);
    }

    try {
    await qrWorker.close();
} catch (error) {
    console.error("QR worker cleanup error:", error.message);
}

    try {
        await linkExpirationWorker.close();
    } catch (error) {
        console.error("Link expiration worker cleanup error:", error.message);
    }

    try {
        await analyticsWorker.close();
    } catch (error) {
        console.error("Analytics worker cleanup error:", error.message);
    }

    try {
        await reportQueue.close();
    } catch (error) {
        console.error("Report queue cleanup error:", error.message);
    }

    try {
        await linkExpirationQueue.close();
    } catch (error) {
        console.error("Link expiration queue cleanup error:", error.message);
    }

    try {
        io.close();
    } catch (error) {
        console.error("Socket.IO cleanup error:", error.message);
    }

    try {
        if (redis.status !== "end") {
            await redis.quit();
        }
    } catch (error) {
        console.error("Redis cleanup error:", error.message);
    }

    try {
        await prisma.$disconnect();
    } catch (error) {
        console.error("Prisma cleanup error:", error.message);
    }
}

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.log(`${signal} received. Shutting down gracefully...`);

    let failed = false;

    const httpClosed = new Promise((resolve) => {
        if (!server.listening) {
            resolve();
            return;
        }

        server.close((error) => {
            if (error) {
                failed = true;
                console.error("HTTP shutdown error:", error.message);
            }
            resolve();
        });
    });

    const shutdownTasks = [
        ["Report worker", () => reportWorker.close()],
        ["Link expiration worker", () => linkExpirationWorker.close()],
        ["Analytics worker", () => analyticsWorker.close()],
        ["Report queue", () => reportQueue.close()],
        ["Link expiration queue", () => linkExpirationQueue.close()],
        ["Socket.IO", () => io.close()],
        [
            "Redis",
            async () => {
                if (redis.status !== "end") {
                    await redis.quit();
                }
            }
        ],
        ["Prisma", () => prisma.$disconnect()]
    ];

    for (const [name, shutdown] of shutdownTasks) {
        try {
            await shutdown();
        } catch (error) {
            failed = true;
            console.error(`${name} shutdown error:`, error.message);
        }
    }

    await httpClosed;

    console.log("LinkFlow shutdown finished.");
    process.exitCode = failed ? 1 : 0;
}

startServer();

process.on("SIGINT", () => {
    gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM");
});
