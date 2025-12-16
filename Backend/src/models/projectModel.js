const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:[true,"Project name is required"],
            trim:true,
        },
        description:{
            type:String,
            trim:true,
            default:'',
        },


        //the user who created the project..
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        },

        members:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },{timestamps:true}
);

const Project = mongoose.model("Project",projectSchema);

module.exports = Project;