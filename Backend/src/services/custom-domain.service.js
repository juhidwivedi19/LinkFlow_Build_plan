const prisma = require("../config/db.config.js");
const crypto = require("crypto");

const {
    verifyDomainOwnership
} = require("./dns.service.js");
// Create a custom domain for a workspace.
async function createCustomDomainService(domain, workspaceId) {
    // Normalize the domain before storing it.
    // This prevents values like "GO.Company.com" and "go.company.com"
    // from being treated as different domains.
    const normalizedDomain = domain.trim().toLowerCase();


    // Reject URLs, paths, ports, and invalid hostnames.
const hostnameRegex =
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

if (!hostnameRegex.test(normalizedDomain)) {
    throw new Error("Invalid domain hostname");
}

    // Check whether this domain is already registered.
    const existingDomain = await prisma.customDomain.findUnique({
        where: {
            domain: normalizedDomain
        }
    });

    if (existingDomain) {
        throw new Error("Custom domain already exists");
    }

    // Generate a random token that will later be used
    // to verify ownership of the domain through DNS.
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const customDomain = await prisma.customDomain.create({
        data: {
            domain: normalizedDomain,
            workspaceId: workspaceId,
            verified: false,
            verificationToken: verificationToken
        }
    });

    return customDomain;
}


// Verify that the workspace owner actually controls the domain.
async function verifyCustomDomainService(domainId) {
    const customDomain = await prisma.customDomain.findUnique({
        where: {
            id: Number(domainId)
        }
    });

    if (!customDomain) {
        throw new Error("Custom domain not found");
    }

    // Already verified, so there is nothing more to do.
    if (customDomain.verified) {
        return customDomain;
    }

    if (!customDomain.verificationToken) {
        throw new Error("Verification token not found");
    }

    // Check the DNS TXT record against our stored token.
    const isVerified = await verifyDomainOwnership(
        customDomain.domain,
        customDomain.verificationToken
    );

    if (!isVerified) {
        throw new Error("Domain verification failed");
    }

    // Mark the domain as verified after the DNS check succeeds.
    const updatedDomain = await prisma.customDomain.update({
        where: {
            id: customDomain.id
        },
        data: {
            verified: true,
            verificationToken: null
        }
    });

    return updatedDomain;
}
module.exports = {
    createCustomDomainService,
    verifyCustomDomainService
};