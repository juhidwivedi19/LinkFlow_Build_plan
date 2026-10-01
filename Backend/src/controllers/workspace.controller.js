const prisma = require("../config/db.config.js")


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
    const workspace = await prisma.$transaction(async (txt) =>{

        const workspace = await tx.workspace.create({
            data:{
                name: name.trim(),
                slug: slug.trim().toLowerCase()
            }
        });

        await tx.membership.create({
            data:{
                userId: userId,
                workspaceId: newWorkspace.id,
                role:"OWNER"
            }
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

        if(name) {
            if(!slug.trim()){
                return res.status(400).json({
                    message: "Workspace slug cannot be empty",
                    status:"failed"
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

        const workspace = await prisma.workspace.update({
            where: {
                id: workspaceId
            },
            data: updateData
        });

        return res.status(200).json({
            message: "Workspace updated successfully",
            status: "success",
             workspace: {
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
                updatedAt: workspace.updatedAt
             }
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

            if (membership.role !== "OWNER") {
            return res.status(403).json({
                message: "Only the workspace owner can delete the workspace",
                status: "failed"
            });
        }

        await prisma.workspace.delete({
            where: {
                id: workspaceId
            }
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

        const allowedRoles = ["ADMIN", "MEMBER", "VIEWER"];

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

        const member = await prisma.membership.create({
            data: {
                userId: user.id,
                workspaceId: workspaceId,
                role: role
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

        if (!workspaceId || !targetUserId) {
            return res.status(400).json({
                message: "Invalid ID",
                status: "failed"
            });
        }

        const allowedRoles = ["ADMIN", "MEMBER", "VIEWER"];

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

        if (currentMembership.role !== "OWNER") {
            return res.status(403).json({
                message: "Only the workspace owner can change member roles",
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
                message: "Member not found in this workspace",
                status: "failed"
            });
        }

        if (targetMembership.role === "OWNER") {
            return res.status(400).json({
                message: "Owner role cannot be changed",
                status: "failed"
            });
        }

        const updatedMembership = await prisma.membership.update({
            where: {
                id: targetMembership.id
            },
            data: {
                role: role
            }
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

        await prisma.membership.delete({
            where: {
                id: targetMembership.id
            }
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