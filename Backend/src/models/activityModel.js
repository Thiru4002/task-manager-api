const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        projectId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Project",
            required:true,
        },
        taskId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Task",
            default: null,
        },
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        action:{
            type:String,
            required:true,
        },
    },{timestamps:true}
);

const Activity = mongoose.model("Activity",activitySchema);

module.exports = Activity;