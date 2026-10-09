const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware.js");
const { authorize } = require("../middlewares/rbac.middleware.js");

const {
    createCustomDomainController,
    verifyCustomDomainController,deleteCustomDomainController
} = require("../controllers/custom-domain.controller.js");
const router = express.Router();

// Add a custom domain to a workspace.
// Only OWNER and ADMIN have MANAGE_TEAM permission.
router.post(
    "/workspaces/:workspaceId/domains",
    authMiddleware.authMiddleware,
    authorize("MANAGE_TEAM"),
    createCustomDomainController
);

// Verify custom domain ownership through DNS.
// Only OWNER and ADMIN can manage custom domains.
router.post(
    "/workspaces/:workspaceId/domains/:domainId/verify",
    authMiddleware.authMiddleware,
    authorize("MANAGE_TEAM"),
    verifyCustomDomainController
);


router.delete(
    "/workspaces/:workspaceId/domains/:domainId",
    authMiddleware.authMiddleware,
    authorize("MANAGE_TEAM"),
    deleteCustomDomainController
);
module.exports = router;