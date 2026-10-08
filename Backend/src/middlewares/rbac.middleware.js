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
        "DELETE_WORKSPACE"
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
        "REMOVE_MEMBER"
    ],

    EDITOR: [
        "VIEW_WORKSPACE",
        "VIEW_ANALYTICS",
        "CREATE_LINK",
        "EDIT_LINK",
        "GENERATE_QR"
    ],

    VIEWER: [
        "VIEW_WORKSPACE",
        "VIEW_ANALYTICS"
    ]
};

// Checks whether a role has a specific permission.
function hasPermission(role, permission) {
    const permissions = rolePermissions[role] || [];

    return permissions.includes(permission);
}

function authorize(permission) {
    return async function (req, res, next) {
        try {
            const { workspaceId } = req.params;

            if (!workspaceId || isNaN(Number(workspaceId))) {
                return res.status(400).json({
                    message: "Valid workspaceId is required",
                    status: "failed"
                });
            }

            const membership = await prisma.membership.findFirst({
                where: {
                    userId: req.user.id,
                    workspaceId: Number(workspaceId)
                }
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this workspace",
                    status: "failed"
                });
            }

            if (!hasPermission(membership.role, permission)) {
                return res.status(403).json({
                    message: "You do not have permission to perform this action",
                    status: "failed"
                });
            }

            // Store membership so controllers can reuse it without another query.
            req.membership = membership;

            next();
        } catch (error) {
            console.error("RBAC authorization error:", error);

            return res.status(500).json({
                message: "Internal server error",
                status: "failed"
            });
        }
    };
}

module.exports = {
    authorize,
    hasPermission
};