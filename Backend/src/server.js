const http=require("http");
require("dotenv").config();


require("./config/db.config.js");

const app = require("./app.js");

const analyticsWorker = require("./workers/analytics.worker.js");

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function gracefulShutdown(signal) {
    console.log(`${signal} received. Shutting down gracefully...`);

    try {
        await analyticsWorker.close();

        server.close(() => {
            console.log("Server closed");
            process.exit(0);
        });
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
}

process.on("SIGINT", () => {
    gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM");
});