const prisma = require("../config/db.config.js");

const {
    createCustomDomainService,
    verifyCustomDomainService
} = require("../services/custom-domain.service.js");

// Create a custom domain for a workspace.
async function createCustomDomainController(req, res) {
    try {
        const workspaceId = Number(req.params.workspaceId);
        const { domain } = req.body;

        if (!workspaceId) {
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

        if (!workspaceId || !domainId) {
            return res.status(400).json({
                message: "Invalid workspace ID or domain ID",
                status: "failed"
            });
        }

        const customDomain = await verifyCustomDomainService(
            domainId,
            workspaceId
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
            return res.status(400).json({
                message: "Domain verification failed. Please check your DNS TXT record.",
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

        if (!workspaceId) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        const domains = await prisma.customDomain.findMany({
            where: {
                workspaceId: workspaceId
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Custom domains fetched successfully",
            status: "success",
            domains: domains
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

        if (!workspaceId || !domainId) {
            return res.status(400).json({
                message: "Invalid workspace ID or domain ID",
                status: "failed"
            });
        }

        // Make sure the domain belongs to this workspace
        // before deleting it.
        const customDomain = await prisma.customDomain.findFirst({
            where: {
                id: domainId,
                workspaceId: workspaceId
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