const Project = require('../models/projectModel');
const User = require('../models/userModel');
const Activity = require("../models/activityModel");
const logActivity = require("../utils/logActivity");

//------------create project----------//
const createProject = async (req,res) => {
    try{
        const {name,description}  = req.body;

        //validate..
        if(!name){
            return res.status(400).json({message:"Project name is required"});
        }

        //create project with owner login user..
        const project = await Project.create({
            name,
            description,
            owner:req.user._id,
            members:[req.user._id],
        });

        //log activity..
        logActivity({
          projectId:project._id,
          userId:req.user._id,
          action:`created project:${project.name}`,
        });

        res.status(201).json({
            status:"success",
            data:project,
        });
    }catch(error){
        res.status(500).json({message:error.message});
    }
};

//--------------------get all projects-------------//
const getAllProjects = async (req, res, next) => {
  try {
    const { search } = req.query;

    let queryObj = {
      // user is owner OR member of the project
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    };

    // Search by project name
    if (search) {
      queryObj.name = { $regex: search, $options: 'i' };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find(queryObj)
      .skip(skip)
      .limit(limit)
      .populate("owner", "username email");

    const total = await Project.countDocuments(queryObj);

    res.status(200).json({
      status: "success",
      count: projects.length,
      total,
      totalPage: Math.ceil(total / limit),
      data: projects
    });

  } catch (err) {
    next(err);
  }
};

//---------public projects---------//
const getPublicProject = async (req,res,next) =>{
  try{
    let queryObj = {};

    //search by title...
    if(req.query.search){
      queryObj.title = {regex:req.query.search,$options:'i'};
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page-1)*limit;

    const projects = await Project.find(queryObj).skip(skip).limit(limit).populate("owner","username email");

    const total = await Project.countDocuments(queryObj);

    res.status(200).json({
      success:true,
      count:projects.length,
      total,
      page,
      totalPage:Math.ceil(total/limit),
      projects
    });

  }catch(err){
    next(err);
  }
};


//-----------------get project-----------//
const getProject = async (req,res) => {
    try{
        const {id} = req.params;

        const project = await Project.findById(id);

        if(!project){
            return res.status(404).json({message:"Project not found"});
        }

        //check permission..
        if (!project.members.map(m => m.toString()).includes(req.user._id.toString())) {
            return res.status(403).json({message:"you do not have access"});
        }

        res.status(200).json({
            status:"success",
            date:project,
        });
    }catch(error){
        return res.status(500).json({message:error.message});
    }
};

//------------update project---------------//
const updateProject = async (req,res,next) => {
    try{
        const {id} = req.params;
        const {name,description} = req.body;

        const project = await Project.findById(id);

        if(!project){
            return res.status(404).json({message:"project is not found"});
        }

        if(project.owner.toString() !=req.user._id.toString() && req.user.role !=="admin"){
            return res.status(403).json({message:"Not allowed"});
        }

        project.name = name || project.name;
        project.description = description || project.description;

        await project.save();

        //log activity..
        logActivity({
          projectId:project._id,
          userId:req.user._id,
          action:`updated project:${project.name}`,
        });

        res.status(200).json({
            status:"success",
            data:project
        });
    }catch(err){
        next(err);
    }
};

//--------------delete project--------------//
const deleteProject = async (req,res,next) => {
    try{
        const {id} = req.params;

        const project = await Project.findById(id);

        if(!project){
            return res.status(404).json({message:"project is not found"});
        }

        if(project.owner.toString() !== req.user._id.toString() && req.user.role !=="admin"){
            return res.status(403).json({message:"you don't have permission"});
        }

        await Project.findByIdAndDelete(id);

        //log activity..
        logActivity({
          projectId:project._id,
          userId:req.user._id,
          action:`deleted project:${project.name}`,
        });


        res.status(200).json({
            status:"success",
            message:"Project delete successfull"
        });
    }catch(err){
        next(err);
    }
};

//-----------activity controllers--------------//

const getActivityLogs = async (req, res, next) => {
  try {
    const { id } = req.params; // projectId

    const logs = await Activity.find({ projectId: id })
      .populate("userId", "username email")
      .populate("taskId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: logs.length,
      data: logs,
    });

  } catch (err) {
    next(err);
  }
};



module.exports = {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  getActivityLogs,
  getPublicProject
};