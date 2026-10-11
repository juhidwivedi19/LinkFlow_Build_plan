const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("./db.config.js");

let io;

/**
 * Initialize Socket.IO and attach it to the existing HTTP server.
 */
function initializeSocket(httpServer) {
    if (io) {
        return io;
    }

    io = new Server(httpServer);

    // Authenticate every incoming Socket.IO connection.
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication token is missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            if (!Number.isSafeInteger(userId) || userId <= 0) {
                return next(new Error("Invalid token payload"));
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                },
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            // Store the authenticated identity on the socket.
            socket.data.userId = user.id;

            next();
        } catch (error) {
            if (error.name === "JsonWebTokenError" ||
                error.name === "TokenExpiredError" ||
                error.name === "NotBeforeError") {
                return next(
                    new Error("Unauthorized: invalid or expired token")
                );
            }

            console.error("Socket authentication error:", error);
            return next(new Error("Socket authentication failed"));
        }
    });

    // Handle authenticated connections.
    io.on("connection", (socket) => {
        console.log(`Authenticated socket connected: ${socket.id}`);

        /**
         * Allow a user to join a workspace only if
         * a corresponding Membership record exists.
         */
        socket.on("join-workspace", async (workspaceId, callback) => {
          const respond = (result) => {
           if (typeof callback === "function") {
             try {
            callback(result);
             } catch (error) {
            console.error("Socket callback error:", error.message);
        }
    }
};

            try {
                if (
                    !Number.isSafeInteger(workspaceId) ||
                    workspaceId <= 0
                ) {
                    return respond({
                        success: false,
                        message: "Invalid workspace ID",
                    });
                }

                const membership = await prisma.membership.findUnique({
                    where: {
                        userId_workspaceId: {
                            userId: socket.data.userId,
                            workspaceId,
                        },
                    },
                    select: {
                        workspaceId: true,
                    },
                });

                if (!membership) {
                    return respond({
                        success: false,
                        message: "You are not authorized to access this workspace",
                    });
                }

                const room = `workspace:${membership.workspaceId}`;

                await socket.join(room);

                return respond({
                    success: true,
                    message: "Joined workspace room successfully",
                });
            } catch (error) {
                console.error("Workspace room join error:", error);

                return respond({
                    success: false,
                    message: "Unable to join workspace room",
                });
            }
        });

        socket.on("disconnect", (reason) => {
            console.log(
                `Socket disconnected: ${socket.id}. Reason: ${reason}`
            );
        });
    });

    return io;
}

/**
 * Return the initialized Socket.IO instance.
 */
function getIO() {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
}


/**
 * Remove a user's connected sockets from a workspace room.
 * Call this after the user's workspace membership is revoked.
 */
async function removeUserFromWorkspace(userId, workspaceId) {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error("Invalid user ID");
    }

    if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
        throw new Error("Invalid workspace ID");
    }

    const sockets = await io.fetchSockets();
    const room = `workspace:${workspaceId}`;

    for (const socket of sockets) {
        if (socket.data.userId === userId) {
            await socket.leave(room);
        }
    }
}
module.exports = {
    initializeSocket,
    getIO,
    removeUserFromWorkspace
};