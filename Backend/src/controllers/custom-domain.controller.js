
const prisma = require("../config/db.config.js");

const {
    createCustomDomainService,
    verifyCustomDomainService
} = require("../services/custom-domain.service.js");

const {
    createNotification
} = require("../services/notification.service.js");

// Create a custom domain for a workspace.
async function createCustomDomainController(req, res) {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const { domain } = req.body;

        if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        if (!domain || typeof domain !== "string") {
            return res.status(400).json({
                message: "Domain is required",
                status: "failed"
            });
        }

        const customDomain = await createCustomDomainService(
            domain,
            workspaceId
        );

        return res.status(201).json({
            message: "Custom domain added successfully",
            status: "success",
            domain: customDomain
        });
    } catch (error) {
        console.error("Create custom domain error:", error);

        if (error.message === "Custom domain already exists") {
            return res.status(409).json({
                message: error.message,
                status: "failed"
            });
        }

        if (error.message === "Invalid domain hostname") {
            return res.status(400).json({
                message: error.message,
                status: "failed"
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

// Verify ownership of a custom domain through DNS.
async function verifyCustomDomainController(req, res) {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const domainId = Number(req.params.domainId);

        if (
            !Number.isSafeInteger(workspaceId) ||
            workspaceId <= 0 ||
            !Number.isSafeInteger(domainId) ||
            domainId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid workspace ID or domain ID",
                status: "failed"
            });
        }

        // Find the domain inside the requested workspace.
        const existingDomain = await prisma.customDomain.findFirst({
            where: {
                id: domainId,
                workspaceId
            }
        });

        if (!existingDomain) {
            return res.status(404).json({
                message: "Custom domain not found",
                status: "failed"
            });
        }

        // Do not send another notification for an already-verified domain.
        if (existingDomain.verified) {
            return res.status(200).json({
                message: "Custom domain is already verified",
                status: "success",
                domain: existingDomain
            });
        }

        // Verify the domain using the existing service.
        const customDomain = await verifyCustomDomainService(domainId);

        // Find members of this workspace.
        const memberships = await prisma.membership.findMany({
            where: {
                workspaceId
            },
            select: {
                userId: true
            }
        });

        // Create a notification for each workspace member.
        await Promise.all(
            memberships.map((membership) =>
                createNotification({
                    userId: membership.userId,
                    type: "DOMAIN_VERIFICATION",
                    title: "Domain verified",
                    message: `Your workspace domain "${customDomain.domain}" has been verified successfully.`,
                    metadata: {
                        domainId: customDomain.id,
                        domain: customDomain.domain,
                        workspaceId,
                        status: "VERIFIED"
                    }
                })
            )
        );

        return res.status(200).json({
            message: "Custom domain verified successfully",
            status: "success",
            domain: customDomain
        });
    } catch (error) {
        console.error("Verify custom domain error:", error);

        if (error.message === "Custom domain not found") {
            return res.status(404).json({
                message: error.message,
                status: "failed"
            });
        }

       if (error.message === "Domain verification failed") {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const domainId = Number(req.params.domainId);

        const domain = await prisma.customDomain.findFirst({
            where: {
                id: domainId,
                workspaceId
            }
        });

        if (domain) {
            const memberships = await prisma.membership.findMany({
                where: {
                    workspaceId
                },
                select: {
                    userId: true
                }
            });

            await Promise.all(
                memberships.map((membership) =>
                    createNotification({
                        userId: membership.userId,
                        type: "DOMAIN_VERIFICATION",
                        title: "Domain verification failed",
                        message: `We couldn't verify "${domain.domain}". Please check its DNS TXT record and try again.`,
                        metadata: {
                            domainId: domain.id,
                            domain: domain.domain,
                            workspaceId,
                            status: "FAILED"
                        }
                    })
                )
            );
        }
    } catch (notificationError) {
        console.error(
            "Domain verification failure notification error:",
            notificationError
        );
    }

    return res.status(400).json({
        message:
            "Domain verification failed. Please check your DNS TXT record.",
        status: "failed"
    });
}

        if (error.message === "Verification token not found") {
            return res.status(400).json({
                message: error.message,
                status: "failed"
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

// Get all custom domains belonging to a workspace.
async function getCustomDomainsController(req, res) {
    try {
        const workspaceId = Number(req.params.workspaceId);

        if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        const domains = await prisma.customDomain.findMany({
            where: {
                workspaceId
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Custom domains fetched successfully",
            status: "success",
            domains
        });
    } catch (error) {
        console.error("Get custom domains error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

// Delete a custom domain from a workspace.
async function deleteCustomDomainController(req, res) {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const domainId = Number(req.params.domainId);

        if (
            !Number.isSafeInteger(workspaceId) ||
            workspaceId <= 0 ||
            !Number.isSafeInteger(domainId) ||
            domainId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid workspace ID or domain ID",
                status: "failed"
            });
        }

        // Confirm that the domain belongs to this workspace.
        const customDomain = await prisma.customDomain.findFirst({
            where: {
                id: domainId,
                workspaceId
            }
        });

        if (!customDomain) {
            return res.status(404).json({
                message: "Custom domain not found",
                status: "failed"
            });
        }

        await prisma.customDomain.delete({
            where: {
                id: customDomain.id
            }
        });

        return res.status(200).json({
            message: "Custom domain deleted successfully",
            status: "success"
        });
    } catch (error) {
        console.error("Delete custom domain error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

module.exports = {
    createCustomDomainController,
    verifyCustomDomainController,
    getCustomDomainsController,
    deleteCustomDomainController
};
