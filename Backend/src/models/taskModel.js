const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title:{
            type:String,
            required:[true,"Task title is required"],
            trim:true,
        },
        description:{
            type:String,
            trim:true,
            default:"",
        },
        projectId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Project",
            required:true,
        },
        creator:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        assignees:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
            }
        ],
        status:{
            type:String,
            enum:["todo","in-progress","done"],
            default:"todo",
        },
        priority:{
            type:"String",
            enum:["low","medium","high"],
            default:"medium",
        },
        tags:[
            {
                type:String,
                trim:true,
            }
        ],
        dueDate:{
            type:Date,
        },
        attachments:[
            {
                type:String,
                trim:true
            }
        ],
        comments:[
            {
                user:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"User",
                },
                text:{
                    type:String,
                    trim:true,
                },
                createdAt:{
                    type:Date,
                    default:Date.now,
                },
            }
        ],
    },{timestamps:true}
);

const Task = mongoose.model("Task",taskSchema);
module.exports = Task;