
const http = require("http");
require("dotenv").config();

const app = require("./app.js");
const prisma = require("./config/db.config.js");
const redis = require("./config/redis.config.js");
const { initializeSocket } = require("./config/socket.config.js");

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Initialize Socket.IO before the worker can emit notifications.
const io = initializeSocket(server);

// Import the worker after Socket.IO initialization.
const analyticsWorker = require("./workers/analytics.worker.js");

let isShuttingDown = false;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    let failed = false;

    // Stop accepting new HTTP connections.
    const httpClosed = new Promise((resolve) => {
        if (!server.listening) {
            resolve();
            return;
        }

        server.close((error) => {
            if (error) {
                failed = true;
                console.error("HTTP shutdown error:", error);
            }

            resolve();
        });
    });

    // Stop processing analytics jobs.
    try {
        await analyticsWorker.close();
    } catch (error) {
        failed = true;
        console.error("Analytics worker shutdown error:", error);
    }

    // Close Socket.IO connections.
    try {
        await new Promise((resolve, reject) => {
            io.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    } catch (error) {
        failed = true;
        console.error("Socket.IO shutdown error:", error);
    }

    // Close the application's shared Redis connection.
    try {
        if (redis.status !== "end") {
            await redis.quit();
        }
    } catch (error) {
        failed = true;
        console.error("Redis shutdown error:", error);
    }

    // Close Prisma's database connections.
    try {
        await prisma.$disconnect();
    } catch (error) {
        failed = true;
        console.error("Prisma shutdown error:", error);
    }

    await httpClosed;

    console.log("LinkFlow shutdown finished.");
    process.exitCode = failed ? 1 : 0;
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

