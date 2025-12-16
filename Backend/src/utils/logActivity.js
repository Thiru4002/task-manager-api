const Activity = require("../models/activityModel");

const logActivity = async ({projectId,taskId = null ,userId , action}) => {
    try{
        await Activity.create({
            projectId,
            taskId,
            userId,
            action,
        });
    }catch(err){
        console.error("Activity log error:",err.message);
    }
};

module.exports = logActivity;