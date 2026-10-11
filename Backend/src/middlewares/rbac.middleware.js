const prisma = require("../config/db.config.js");

const rolePermissions = {
  OWNER: [
    "VIEW_WORKSPACE",
    "VIEW_ANALYTICS",
    "CREATE_LINK",
    "EDIT_LINK",
    "DELETE_LINK",
    "GENERATE_QR",
    "MANAGE_TEAM",
    "CHANGE_ROLE",
    "REMOVE_MEMBER",
    "DELETE_WORKSPACE",
  ],

  ADMIN: [
    "VIEW_WORKSPACE",
    "VIEW_ANALYTICS",
    "CREATE_LINK",
    "EDIT_LINK",
    "DELETE_LINK",
    "GENERATE_QR",
    "MANAGE_TEAM",
    "CHANGE_ROLE",
    "REMOVE_MEMBER",
  ],

  EDITOR: [
    "VIEW_WORKSPACE",
    "VIEW_ANALYTICS",
    "CREATE_LINK",
    "EDIT_LINK",
    "GENERATE_QR",
  ],

  VIEWER: [
    "VIEW_WORKSPACE",
    "VIEW_ANALYTICS",
  ],
};

// Check whether a role has a specific permission.
function hasPermission(role, permission) {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

// Check workspace membership and permission.
function authorize(permission) {
  return async function (req, res, next) {
    try {
      // JWT authentication must run before this middleware.
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const workspaceId = Number(req.params.workspaceId);

      if (
        !req.params.workspaceId ||
        !Number.isSafeInteger(workspaceId) ||
        workspaceId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid workspaceId is required",
        });
      }

      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.user.id,
          workspaceId,
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this workspace",
        });
      }

      if (!hasPermission(membership.role, permission)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
        });
      }

      // Allow downstream controllers to reuse the membership.
      req.membership = membership;

      return next();
    } catch (error) {
      console.error("RBAC authorization error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

module.exports = {
  authorize,
  hasPermission,
};