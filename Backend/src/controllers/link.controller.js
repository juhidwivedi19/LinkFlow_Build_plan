const prisma = require("../config/db.config.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const {
    getRedis,
    setRedis,
    deleteRedis,
    deleteDashboardCache
} = require("../services/redis.service.js");


// CREATE LINK CONTROLLER
async function createLinkController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        const {
            url,
            slug,
            title,
            description,
            expiresAt,
            password,
            status,
            customDomainId
        } = req.body;

        // Validate workspace ID
        if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        // Check workspace membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: userId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        // Validate custom domain if provided.
        // The domain must belong to this workspace and must already be verified.
        if (customDomainId !== undefined && customDomainId !== null) {
            const customDomain = await prisma.customDomain.findFirst({
                where: {
                    id: Number(customDomainId),
                    workspaceId: workspaceId,
                    verified: true
                }
            });

            if (!customDomain) {
                return res.status(400).json({
                    message:
                        "Custom domain not found, does not belong to this workspace, or is not verified",
                    status: "failed"
                });
            }
        }

        // Validate URL
        if (!url || !url.trim()) {
            return res.status(400).json({
                message: "URL is required",
                status: "failed"
            });
        }

        try {
            new URL(url.trim());
        } catch {
            return res.status(400).json({
                message: "Invalid URL",
                status: "failed"
            });
        }

        // Validate title
        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Title is required",
                status: "failed"
            });
        }

        // Generate slug if custom slug is not provided
        let finalSlug;

        if (slug && slug.trim()) {
            finalSlug = slug.trim().toLowerCase();

            const existingSlug = await prisma.link.findUnique({
                where: {
                    slug: finalSlug
                }
            });

            if (existingSlug) {
                return res.status(409).json({
                    message: "Slug already exists",
                    status: "failed"
                });
            }
        } else {
            finalSlug = crypto.randomBytes(5).toString("hex");

            let existingSlug = await prisma.link.findUnique({
                where: {
                    slug: finalSlug
                }
            });

            while (existingSlug) {
                finalSlug = crypto.randomBytes(5).toString("hex");

                existingSlug = await prisma.link.findUnique({
                    where: {
                        slug: finalSlug
                    }
                });
            }
        }

        // Validate expiration date
        let parsedExpiresAt = null;

        if (expiresAt) {
            parsedExpiresAt = new Date(expiresAt);

            if (isNaN(parsedExpiresAt.getTime())) {
                return res.status(400).json({
                    message: "Invalid expiration date",
                    status: "failed"
                });
            }

            if (parsedExpiresAt <= new Date()) {
                return res.status(400).json({
                    message: "Expiration date must be in the future",
                    status: "failed"
                });
            }
        }

        // Hash password if provided
        let passwordHash = null;

        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        // Create link
        const link = await prisma.link.create({
            data: {
                url: url.trim(),
                slug: finalSlug,
                title: title.trim(),
                description: description
                    ? description.trim()
                    : null,
                expiresAt: parsedExpiresAt,
                passwordHash: passwordHash,
                workspaceId: workspaceId,

                // Store custom domain when provided.
                // Otherwise the link uses the default LinkFlow domain.
                customDomainId: customDomainId
                    ? Number(customDomainId)
                    : null
            }
        });

        // Invalidate dashboard cache because a new link
        // can change dashboard statistics and Top Links.
        try {
            await deleteDashboardCache(workspaceId);
        } catch (error) {
            console.error(
                "Dashboard cache invalidation error:",
                error
            );
        }

        return res.status(201).json({
            message: "Link created successfully",
            status: "success",
            link: {
                id: link.id,
                url: link.url,
                slug: link.slug,
                title: link.title,
                description: link.description,
                expiresAt: link.expiresAt,
                workspaceId: link.workspaceId,
                customDomainId: link.customDomainId,
                createdAt: link.createdAt
            }
        });

    } catch (error) {
        console.error("Create link error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}


// GET WORKSPACE LINKS CONTROLLER
async function getWorkspaceLinksController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        // Validate workspace ID
        if (!Number.isInteger(workspaceId)) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        // Check whether the user belongs to this workspace
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: userId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        // Fetch links belonging to this workspace
        const links = await prisma.link.findMany({
            where: {
                workspaceId: workspaceId
            },
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                url: true,
                slug: true,
                title: true,
                description: true,
                expiresAt: true,
                workspaceId: true,
                customDomainId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return res.status(200).json({
            message: "Workspace links fetched successfully",
            status: "success",
            links: links
        });

    } catch (error) {
        console.error("Get workspace links error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}


// GET LINK CONTROLLER
async function getLinkController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);
        const linkId = Number(req.params.linkId);

        if (
            !Number.isInteger(workspaceId) ||
            workspaceId <= 0 ||
            !Number.isInteger(linkId) ||
            linkId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid workspace ID or link ID",
                status: "failed"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: userId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        const link = await prisma.link.findFirst({
            where: {
                id: linkId,
                workspaceId: workspaceId
            },
            select: {
                id: true,
                url: true,
                slug: true,
                title: true,
                description: true,
                expiresAt: true,
                workspaceId: true,
                customDomainId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        return res.status(200).json({
            message: "Link fetched successfully",
            status: "success",
            link: link
        });

    } catch (error) {
        console.error("Get link error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}


// UPDATE LINK CONTROLLER
async function updateLinkController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);
        const linkId = Number(req.params.linkId);

        const {
            url,
            slug,
            title,
            description,
            expiresAt,
            password,
            status,
            customDomainId
        } = req.body;

        // Validate workspace and link IDs.
        if (
            !Number.isInteger(workspaceId) ||
            workspaceId <= 0 ||
            !Number.isInteger(linkId) ||
            linkId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid workspace ID or link ID",
                status: "failed"
            });
        }

        // Ensure the user belongs to this workspace.
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        // Ensure the link belongs to this workspace.
        const existingLink = await prisma.link.findFirst({
            where: {
                id: linkId,
                workspaceId
            }
        });

        if (!existingLink) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        const updateData = {};

        // Validate a custom domain before attaching it.
        // The domain must belong to this workspace and be verified.
        if (customDomainId !== undefined && customDomainId !== null) {
            const parsedDomainId = Number(customDomainId);

            if (
                !Number.isInteger(parsedDomainId) ||
                parsedDomainId <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid custom domain ID",
                    status: "failed"
                });
            }

            const customDomain = await prisma.customDomain.findFirst({
                where: {
                    id: parsedDomainId,
                    workspaceId,
                    verified: true
                }
            });

            if (!customDomain) {
                return res.status(400).json({
                    message:
                        "Custom domain not found, does not belong to this workspace, or is not verified",
                    status: "failed"
                });
            }

            updateData.customDomainId = parsedDomainId;
        } else if (customDomainId === null) {
            // Explicit null removes the custom domain.
            updateData.customDomainId = null;
        }

        // Validate and update URL.
        if (url !== undefined) {
            if (typeof url !== "string" || !url.trim()) {
                return res.status(400).json({
                    message: "URL cannot be empty",
                    status: "failed"
                });
            }

            try {
                new URL(url.trim());
            } catch {
                return res.status(400).json({
                    message: "Invalid URL",
                    status: "failed"
                });
            }

            updateData.url = url.trim();
        }

        // Validate and update title.
        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    message: "Title cannot be empty",
                    status: "failed"
                });
            }

            updateData.title = title.trim();
        }

        // Update description; an empty value clears it.
        if (description !== undefined) {
            if (description !== null && typeof description !== "string") {
                return res.status(400).json({
                    message: "Invalid description",
                    status: "failed"
                });
            }

            updateData.description = description
                ? description.trim()
                : null;
        }

        // Validate and update slug.
        if (slug !== undefined) {
            if (typeof slug !== "string" || !slug.trim()) {
                return res.status(400).json({
                    message: "Slug cannot be empty",
                    status: "failed"
                });
            }

            const newSlug = slug.trim().toLowerCase();

            if (newSlug !== existingLink.slug) {
                const slugExists = await prisma.link.findUnique({
                    where: {
                        slug: newSlug
                    }
                });

                if (slugExists) {
                    return res.status(409).json({
                        message: "Slug already exists",
                        status: "failed"
                    });
                }
            }

            updateData.slug = newSlug;
        }

        // Validate and update expiration date.
        if (expiresAt !== undefined) {
            if (expiresAt === null || expiresAt === "") {
                updateData.expiresAt = null;
            } else {
                const parsedExpiresAt = new Date(expiresAt);

                if (isNaN(parsedExpiresAt.getTime())) {
                    return res.status(400).json({
                        message: "Invalid expiration date",
                        status: "failed"
                    });
                }

                if (parsedExpiresAt <= new Date()) {
                    return res.status(400).json({
                        message: "Expiration date must be in the future",
                        status: "failed"
                    });
                }

                updateData.expiresAt = parsedExpiresAt;
            }
        }

        // Update or remove password protection.
        if (password !== undefined) {
            if (password === "") {
                updateData.passwordHash = null;
            } else {
                if (typeof password !== "string") {
                    return res.status(400).json({
                        message: "Invalid password",
                        status: "failed"
                    });
                }

                updateData.passwordHash = await bcrypt.hash(
                    password,
                    10
                );
            }
        }

        // Validate and update link status.
        if (status !== undefined) {
            if (status !== "ACTIVE" && status !== "DISABLED") {
                return res.status(400).json({
                    message: "Invalid link status",
                    status: "failed"
                });
            }

            updateData.status = status;
        }

        // Save changes and return the updated link.
        const updatedLink = await prisma.link.update({
            where: {
                id: linkId
            },
            data: updateData,
            select: {
                id: true,
                url: true,
                slug: true,
                title: true,
                description: true,
                expiresAt: true,
                status: true,
                workspaceId: true,
                customDomainId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Remove cached entries so the redirect uses updated link data.
        await deleteRedis(`link:${existingLink.slug}`);
        await deleteRedis(`link:${updatedLink.slug}`);

        // Link changes can affect dashboard results.
        try {
            await deleteDashboardCache(workspaceId);
        } catch (error) {
            console.error(
                "Dashboard cache invalidation error:",
                error
            );
        }

        return res.status(200).json({
            message: "Link updated successfully",
            status: "success",
            link: updatedLink
        });

    } catch (error) {
        console.error("Update link error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}


// DELETE LINK CONTROLLER
async function deleteLinkController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);
        const linkId = Number(req.params.linkId);

        // Validate IDs
        if (
            !Number.isInteger(workspaceId) ||
            workspaceId <= 0 ||
            !Number.isInteger(linkId) ||
            linkId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid workspace ID or link ID",
                status: "failed"
            });
        }

        // Check workspace membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: userId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        // Check whether link belongs to this workspace
        const link = await prisma.link.findFirst({
            where: {
                id: linkId,
                workspaceId: workspaceId
            }
        });

        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        // Delete link
        await prisma.link.delete({
            where: {
                id: linkId
            }
        });

        // Remove deleted link from Redis cache
        await deleteRedis(`link:${link.slug}`);

        // Invalidate workspace dashboard cache because
        // deleting a link can change dashboard Top Links.
        try {
            await deleteDashboardCache(workspaceId);
        } catch (error) {
            console.error(
                "Dashboard cache invalidation error:",
                error
            );
        }

        return res.status(200).json({
            message: "Link deleted successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Delete link error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}


module.exports = {
    createLinkController,
    getWorkspaceLinksController,
    getLinkController,
    updateLinkController,
    deleteLinkController
};