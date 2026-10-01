const prisma = require("../config/db.config.js")


async function createWorkspaceController(req,res){
    try{

    }catch(error){
        return res.status(500).json({

            message:error.console,
            status:failed
        })
    }
}



module.exports= {
    createWorkspaceController
}