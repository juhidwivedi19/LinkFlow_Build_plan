const prisma = require("../config/db.config.js")
const { createActivityLog } = require("../services/activityLog.service.js");
const { createNotification } = require("../services/notification.service.js");

//CREATE WORKSPACE CONTROLLER
async function createWorkspaceController(req,res){
    try{

    const userId = req.user.id;
    const{name,slug} = req.body;

    //validate name 
    if(!name || !name.trim()){
        return res.status(400).json({
            message:"Workspace name is required",
            status:"failed"
        });
    }

    //validate slug
    if(!slug || !slug.trim()){
        return res.status(400).json({
            message:"Workspace slug is required",
            status:"failed"
        });
    }

    //check slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
        where:{
            slug:slug
        }
    });

    if(existingWorkspace){
        return res.status(409).json({
            message: "Workspace slug already exists",
            status:"failed"
        });
    }

    //create workspace + owner membership automatically
  // Create workspace, owner membership, and activity log atomically
const workspace = await prisma.$transaction(async (tx) => {
    const newWorkspace = await tx.workspace.create({
        data: {
            name: name.trim(),
            slug: slug.trim().toLowerCase()
        }
    });

    await tx.membership.create({
        data: {
            userId: userId,
            workspaceId: newWorkspace.id,
            role: "OWNER"
        }
    });

    await createActivityLog({
        workspaceId: newWorkspace.id,
        userId: userId,
        action: "WORKSPACE_CREATED",
        entityType: "Workspace",
        entityId: newWorkspace.id,
        metadata: {
            name: newWorkspace.name,
            slug: newWorkspace.slug
        },
        tx
    });

    return newWorkspace;
});

    return res.status(201).json({
        message: "Workspace created successfully",
        status: "success",
        workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            createdAt: workspace.createdAt
        }
    });

    }catch(error){
        console.error("Create workspace error:", error);
       
        return res.status(500).json({
            message:error.message,
            status:"failed"
        })
    }
}


//GET USERWORKSPACE CONTROLLER
async function getUserWorkspaceController(req,res){
    try{
   const userId = req.user.id;

   const memberships = await prisma.membership.findMany({
    where:{
        userId: userId
    },
    include: {
        workspace: true
    }
   });

   const workspaces = memberships.map((membership)=>({
       id: membership.workspace.id,
       name: membership.workspace.name,
            slug: membership.workspace.slug,
            role: membership.role,
            createdAt: membership.workspace.createdAt
   }));
   return res.status(200).json({
       message: "User workspaces retrieved successfully",
       status: "success",
       workspaces: workspaces
   });
    }catch(error){
        console.error("Get workspaces error:",error);
        return res.status(500).json({
            message:error.message,
            status:"failed"
        });
    }
}


//GET ONE WORKSPACE
async function getWorkspaceController(req,res){
    try{
   const userId = req.user.id;
   const workspaceId = Number(req.params.workspaceId);

   if(!workspaceId){
    return res.status(400).json({
        message: "Invalid workspace Id",
        status:"failed"
    });
   }

   const membership = await prisma.membership.findUnique({
    where:{
        userId_workspaceId: {
            userId: userId,
            workspaceId: workspaceId
        }
    },
    include:{
        workspace:true
    }
   });

   if(!membership){
    return res.status(403).json({
        message: "You do not have access to this workspace",
        status:"failed"
    });
   }

     return res.status(200).json({
            message: "Workspace fetched successfully",
            status: "success",
            workspace: {
                id: membership.workspace.id,
                name: membership.workspace.name,
                slug: membership.workspace.slug,
                role: membership.role,
                createdAt: membership.workspace.createdAt,
                updatedAt: membership.workspace.updatedAt
            }
        });

    }catch(error){
        console.error("Get workspace error:",error);

        return res.status(500).json({
            message:error.message,
            status:"failed"
        });
    }
}


//UPDATE WORKSPACE ERROR
async function updateWorkspaceController(req,res){
    try{
  
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        const {name,slug} = req.body;

        if(!workspaceId){
            return res.status(400).json({
                message: "Invalid workspace Id",
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

         if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
            return res.status(403).json({
                message: "You do not have permission to update this workspace",
                status: "failed"
            });
        }

        if (!name && !slug) {
            return res.status(400).json({
                message: "At least one field is required",
                status: "failed"
            });
        }

        const updateData = {};

        if(name != undefined) {
            if(!name.trim()){
                return res.status(400).json({
                    message: "Workspace name cannot be empty",
                    status:"failed"
                });
            }

               updateData.name = name.trim();
}

if (slug !== undefined) {

    if (!slug.trim()) {
        return res.status(400).json({
            message: "Workspace slug cannot be empty",
            status: "failed"
        });
    }

            const normalizedSlug = slug.trim().toLowerCase();
           
            const existingWorkspace = await prisma.workspace.findUnique({
                where: {
                    slug: normalizedSlug,
                    NOT: {
                        id: workspaceId
                    }
                }
            });

            if (existingWorkspace ) {
                return res.status(400).json({
                    message: "Workspace slug already exists",
                    status: "failed"
                });
            }

            updateData.slug = normalizedSlug;
        }
// Update workspace and record activity atomically
const workspace = await prisma.$transaction(async (tx) => {
    const updatedWorkspace = await tx.workspace.update({
        where: {
            id: workspaceId
        },
        data: updateData
    });

    await createActivityLog({
        workspaceId: updatedWorkspace.id,
        userId: userId,
        action: "WORKSPACE_UPDATED",
        entityType: "Workspace",
        entityId: updatedWorkspace.id,
        metadata: {
            name: updatedWorkspace.name,
            slug: updatedWorkspace.slug
        },
        tx
    });

    return updatedWorkspace;
});

    }catch(error){
        console.error("Update workspace error:",error);

        return res.status(500).json({
            message: error.message,
            status:"failed"
        });
    }
}


//DELETE WORKSPACE CONTROLLER
async function deleteWorkspaceController(req,res){
    try{

          const userId = req.user.id;
          const workspaceId = Number(req.params.workspaceId);

          if(!workspaceId){
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
          }

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
                status: "failed"
            });
          }

      // Delete workspace and record activity atomically
await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.findUnique({
        where: {
            id: workspaceId
        },
        select: {
            id: true,
            name: true,
            slug: true
        }
    });

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    await createActivityLog({
        workspaceId: workspace.id,
        userId: userId,
        action: "WORKSPACE_DELETED",
        entityType: "Workspace",
        entityId: workspace.id,
        metadata: {
            name: workspace.name,
            slug: workspace.slug
        },
        tx
    });

    await tx.workspace.delete({
        where: {
            id: workspaceId
        }
    });
});
        return res.status(200).json({
            message: "Workspace deleted successfully",
            status: "success"
        });
    }catch(error){
        console.error("Delete workspace error:",error);

        return res.status(500).json({
            message: error.message,
            status:"failed"
        });
    }
}


//GET WORKSPACE MEMBERS
async function getWorkspaceMembersController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        if (!workspaceId) {
            return res.status(400).json({
                message: "Invalid workspace ID",
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

        const members = await prisma.membership.findMany({
            where: {
                workspaceId: workspaceId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return res.status(200).json({
            message: "Workspace members fetched successfully",
            status: "success",
            members: members.map((member) => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role,
                joinedAt: member.createdAt
            }))
        });

    } catch (error) {
        console.error("Get workspace members error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}


//ADD WORKSPACE MEMBERS
async function addWorkspaceMemberController(req, res) {
    try {
        const currentUserId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        const { email, role } = req.body;

        if (!workspaceId) {
            return res.status(400).json({
                message: "Invalid workspace ID",
                status: "failed"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Email is required",
                status: "failed"
            });
        }

        const allowedRoles = ["ADMIN", "EDITOR", "VIEWER"];

        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role",
                status: "failed"
            });
        }

        const currentMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: currentUserId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!currentMembership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        if (
            currentMembership.role !== "OWNER" &&
            currentMembership.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You do not have permission to add members",
                status: "failed"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed"
            });
        }

        const existingMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: user.id,
                    workspaceId: workspaceId
                }
            }
        });

        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this workspace",
                status: "failed"
            });
        }
const member = await prisma.$transaction(async (tx) => {
    const newMember = await tx.membership.create({
        data: {
            userId: user.id,
            workspaceId,
            role
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            workspace: {
                select: {
                    name: true
                }
            }
        }
    });

    //RECORD THE ACTIVITY LOG
    await createActivityLog({
        workspaceId,
        userId: currentUserId,
        action: "TEAM_MEMBER_ADDED",
        entityType: "Membership",
        entityId: newMember.id,
        metadata: {
            email: newMember.user.email,
            role: newMember.role
        },
        tx
    });

    //CREATE THE  notification 
    await createNotification({
        userId: newMember.user.id,
        type: "TEAM_INVITATION",
        title: "Added to a workspace",
        message: `You have been added to the workspace "${newMember.workspace.name}" with the role ${newMember.role}.`,
        metadata: {
            workspaceId,
            workspaceName: newMember.workspace.name,
            role: newMember.role
        },
        tx
    });

    return newMember;
});
        return res.status(201).json({
            message: "Member added successfully",
            status: "success",
            member: {
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role
            }
        });

    } catch (error) {
        console.error("Add workspace member error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}


//CHANGE MEMBERS ROLE
async function updateMemberRoleController(req, res) {
    try {
        const currentUserId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);
        const targetUserId = Number(req.params.userId);

        const { role } = req.body;

        // Validate IDs
        if (!workspaceId || !targetUserId) {
            return res.status(400).json({
                message: "Invalid ID",
                status: "failed"
            });
        }

        // These are the roles that can be assigned.
        const allowedRoles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];

        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role",
                status: "failed"
            });
        }

        // Find the person performing the role change.
        const currentMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: currentUserId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!currentMembership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        // Only OWNER and ADMIN can change member roles.
        if (
            currentMembership.role !== "OWNER" &&
            currentMembership.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You do not have permission to change member roles",
                status: "failed"
            });
        }

        // Find the member whose role is being changed.
        const targetMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: targetUserId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!targetMembership) {
            return res.status(404).json({
                message: "Member not found in this workspace",
                status: "failed"
            });
        }

        // ADMIN cannot modify an OWNER.
        if (
            currentMembership.role === "ADMIN" &&
            targetMembership.role === "OWNER"
        ) {
            return res.status(403).json({
                message: "Admin cannot change the owner's role",
                status: "failed"
            });
        }

        // ADMIN cannot promote anyone to OWNER.
        if (
            currentMembership.role === "ADMIN" &&
            role === "OWNER"
        ) {
            return res.status(403).json({
                message: "Admin cannot assign the OWNER role",
                status: "failed"
            });
        }

        // Update the member's role.
      // Update member role and create activity log atomically.
const updatedMembership = await prisma.$transaction(async (tx) => {
    const updated = await tx.membership.update({
        where: {
            id: targetMembership.id
        },
        data: {
            role
        }
    });

    await createActivityLog({
        workspaceId,
        userId: currentUserId,
        action: "TEAM_MEMBER_ROLE_UPDATED",
        entityType: "Membership",
        entityId: updated.id,
        metadata: {
            targetUserId,
            previousRole: targetMembership.role,
            newRole: updated.role
        },
        tx
    });

    return updated;
});
        return res.status(200).json({
            message: "Member role updated successfully",
            status: "success",
            member: {
                userId: updatedMembership.userId,
                workspaceId: updatedMembership.workspaceId,
                role: updatedMembership.role
            }
        });

    } catch (error) {
        console.error("Update member role error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}

async function removeWorkspaceMemberController(req, res) {
    try {
        const currentUserId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);
        const targetUserId = Number(req.params.userId);

        if (!workspaceId || !targetUserId) {
            return res.status(400).json({
                message: "Invalid ID",
                status: "failed"
            });
        }

        const currentMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: currentUserId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!currentMembership) {
            return res.status(403).json({
                message: "You do not have access to this workspace",
                status: "failed"
            });
        }

        if (
            currentMembership.role !== "OWNER" &&
            currentMembership.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You do not have permission to remove members",
                status: "failed"
            });
        }

        const targetMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: targetUserId,
                    workspaceId: workspaceId
                }
            }
        });

        if (!targetMembership) {
            return res.status(404).json({
                message: "Member not found",
                status: "failed"
            });
        }

        if (targetMembership.role === "OWNER") {
            return res.status(400).json({
                message: "Workspace owner cannot be removed",
                status: "failed"
            });
        }

        if (
            currentMembership.role === "ADMIN" &&
            targetMembership.role === "ADMIN"
        ) {
            return res.status(403).json({
                message: "Admin cannot remove another admin",
                status: "failed"
            });
        }
// Remove member and record the activity atomically.
await prisma.$transaction(async (tx) => {
    await tx.membership.delete({
        where: {
            id: targetMembership.id
        }
    });

    await createActivityLog({
        workspaceId,
        userId: currentUserId,
        action: "TEAM_MEMBER_REMOVED",
        entityType: "Membership",
        entityId: targetMembership.id,
        metadata: {
            removedUserId: targetUserId,
            previousRole: targetMembership.role
        },
        tx
    });
});

        return res.status(200).json({
            message: "Member removed successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Remove workspace member error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}


//LEAVE WORKSPACE
async function leaveWorkspaceController(req, res) {
    try {
        const userId = req.user.id;
        const workspaceId = Number(req.params.workspaceId);

        if (!workspaceId) {
            return res.status(400).json({
                message: "Invalid workspace ID",
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
            return res.status(404).json({
                message: "You are not a member of this workspace",
                status: "failed"
            });
        }

        if (membership.role === "OWNER") {
            return res.status(400).json({
                message: "Owner cannot leave the workspace. Transfer ownership or delete the workspace.",
                status: "failed"
            });
        }

        await prisma.membership.delete({
            where: {
                id: membership.id
            }
        });

        return res.status(200).json({
            message: "You have left the workspace successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Leave workspace error:", error);

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}
//Remove member
module.exports= {
    createWorkspaceController,
    getUserWorkspaceController,
    getWorkspaceController,
    getWorkspaceMembersController,
    addWorkspaceMemberController,
    removeWorkspaceMemberController,
    updateWorkspaceController,
    updateMemberRoleController,
    leaveWorkspaceController,
    deleteWorkspaceController
}