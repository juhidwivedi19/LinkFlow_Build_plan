const prisma = require("../config/db.config.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


//CREATE LINK CONTROLLER
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
            password
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
                workspaceId: workspaceId
            }
        });

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

//GET WORKSPACE LINKS CONTROLLER
async function getWorkspaceLinksController(req,res){
    try{

          const userId = req.user.id;
          const workspaceId = Number(req.params.workspaceId);

          //validate workspace id
          if(!Number.isInteger(workspaceId)){
              return res.status(400).json({
                  message: "Invalid workspace ID",
                  status: "failed"
              });
          }

          //check whether the user belong to this workspace
          const membership = await prisma.membership.findUnique({
            where:{
                userId_workspaceId: {
                    userId: userId,
                    workspaceId: workspaceId
                }
            }
          });

          if(!membership){
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status:"failed"
            });
          }

          //fetch links belonging to this workspace
          const links = await prisma.link.findMany({
            where: {
                workspaceId: workspaceId
            },
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id:true,
                url:true,
                slug:true,
                title:true,
                description: true,
                expiresAt: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true
            }
          });

          return res.status(200).json({
            message: "Workspace links fetched successfully",
            status: "success",
            links: links
          });
    }catch(error){
        console.error("Get workspace links error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}

//get link controller
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


//UPDATE LINK CONTROLLER
async function updateLinkController(req, res) {
   try{
const userId = req.user.id;
const workspaceId = Number(req.params.workspaceId);
const linkId = Number(req.params.linkId);

const {
            url,
            slug,
            title,
            description,
            expiresAt,
            password
        } = req.body;

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
        const existingLink = await prisma.link.findFirst({
            where: {
                id: linkId,
                workspaceId: workspaceId
            }
        });

         if (!existingLink) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }


        // Prepare update data
        const updateData = {};

        // Validate and update URL
        if (url !== undefined) {
            if (!url.trim()) {
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

           // Validate and update title
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: "Title cannot be empty",
                    status: "failed"
                });
            }

            updateData.title = title.trim();
        }

            // Update description
        if (description !== undefined) {
            updateData.description = description
                ? description.trim()
                : null;
        }

        // Validate and update slug
        if (slug !== undefined) {
            if (!slug.trim()) {
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


        // Validate and update expiration date
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

          // Update password
        if (password !== undefined) {
            if (password === "") {
                // Remove password protection
                updateData.passwordHash = null;
            } else {
                updateData.passwordHash = await bcrypt.hash(password, 10);
            }
        }

         // Update link
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
                workspaceId: true,
                createdAt: true,
                updatedAt: true
            }
             });

        return res.status(200).json({
            message: "Link updated successfully",
            status: "success",
            link: updatedLink
        });
   }catch(error){
    console.error("Update link error:", error);

    return res.status(500).json({
        message: error.message,
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
}