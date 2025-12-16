const Task = require("../models/taskModel");
const Project = require("../models/projectModel");
const logActivity = require("../utils/logActivity");

//------------create Task--------------//
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      priority,
      dueDate,
      assignees
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: "Title and projectId are required" });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permission
    if (!project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You do not have permission to access this project" });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      projectId,
      priority,
      dueDate,
      assignees,
      creator: req.user._id,
    });

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `Created task: ${task.title}`,
    });

    res.status(201).json({
      status: "success",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//----------------get all tasks------------//
const getAllTask = async (req, res) => {
  try {
    const { projectId, status, priority, search } = req.query;

    let queryObj = {};

    if (search) {
      queryObj.title = { $regex: search, $options: "i" };
    }

    if (projectId) queryObj.projectId = projectId;
    if (status) queryObj.status = status;
    if (priority) queryObj.priority = priority;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(queryObj)
      .skip(skip)
      .limit(limit)
      .populate("creator", "username email");

    const total = await Task.countDocuments(queryObj);

    res.status(200).json({
      status: "success",
      count: tasks.length,
      total,
      totalPage: Math.ceil(total / limit),
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//------------------get single task----------------//
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("creator", "username email")
      .populate("assignees", "username email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);

    // Check user is member of the project
    if (!project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You do not have access to this task" });
    }

    res.status(200).json({
      status: "success",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//------------------update task ---------------//
const updateTask = async (req,res,next) => {
  try{
    const {id} = req.params;

    let task = await Task.findById(id);

    if(!task){
      return res.status(404).json({message:"Task not found"});
    }

    //check permission through project memberShip
    const project = await Project.findById(task.projectId);

    if(!project.members.includes(req.user._id)){
      return res.status(403).json({message:"You do not have permission"});
    }

    //update fields..
    task.title = req.body || task.title;
    task.description = req.body || task.description;
    task.priority = req.body.priority || task.priority;
    task.status = req.body || task.body;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.assignees = req.body.assignees || task.assignees;

    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `updated task: ${task.title}`,
    });

    res.status(200).json({status:"success",data:task});
  }catch(err){
    next(err);
  }
};

//--------------delete Task-------------------//
const deleteTask = async (req,res,next) => {
  try{
    const {id} = req.params;
    const task = await Task.findById(id);

    if(!task){
      return res.status(404).json({message:"Task not found"});
    }
    //permission check..
    const project = await Project.findById(task.projectId);

    if(!project.members.includes(req.user._id)){
      return res.status(403).json({message:"You do not have permission"});
    }

    await task.deleteOne();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `Deleted task: ${task.title}`,
    });

    res.status(200).json({
      status:"success",
      message:"Task deleted successfully"
    });
  }catch(err){
    next(err);
  }
};

//-------------updateTaskStatus-----------------//
const updateTaskStatus = async (req,res,next) => {
  try{
    const {id} = req.params;

    const task = await Task.findById(id);

    if(!task){
      return res.status(404).json({message:"task not found"});
    }

    const project = await Project.findById(task.projectId);

    if(!project.members.includes(req.user._id)){
      return res.status(403).json({message:"You do not have permission"});
    }

    const allowedStatus = ["todo", "in-progress", "done"];

    if (!allowedStatus.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }


    task.status = req.body.status || task.status;

    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `updated task status: ${task.title}`,
    });

    res.status(200).json({
      status:"success",
      data:task
    });
  }catch(err){
    next(err);
  }
};

//------------------- create comments------------//
const createComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Find task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    // Check project membership
    const project = await Project.findById(task.projectId);

    if (!project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    // Add new comment
    task.comments.push({
      user: req.user._id,
      text: text,
      createdAt: Date.now()
    });

    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `Created task: ${task.title}`,
    });

    res.status(201).json({
      status: "success",
      data: task
    });

  } catch (err) {
    next(err);
  }
};

//-----------------delete comments-------------//
const deleteComments = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    // Find task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    // Check project membership
    const project = await Project.findById(task.projectId);
    if (!project.members.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You do not have permission" });
    }

    // Find comment inside task
    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }

    // Ownership check
    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "not allowed" });
    }

    // Delete comment
    comment.deleteOne();

    // Save task
    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `Deleted comments: ${task.title}`,
    });

    res.status(200).json({
      status: "success",
      message: "comment deleted",
    });
  } catch (err) {
    next(err);
  }
};

//-----------------assign user to task-----------//
const assign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // 1. Find task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    // 2. Find project
    const project = await Project.findById(task.projectId);

    // 3. Check if requested user is part of the project
    const isMember = project.members
      .map((m) => m.toString())
      .includes(userId);

    if (!isMember) {
      return res
        .status(400)
        .json({ message: "User is not a member of this project" });
    }

    // 4. Check duplicate assignment
    const alreadyAssigned = task.assignees
      .map((a) => a.toString())
      .includes(userId);

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "User already assigned to this task" });
    }

    // 5. Assign
    task.assignees.push(userId);

    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `task assigned: ${task.title}`,
    });

    res.status(200).json({
      status: "success",
      message: "User assigned successfully",
      data: task,
    });
  } catch (err) {
    next(err);
  }
};

//--------------un assign-----------//
const unassign = async (req,res,next) => {
  try{
    const {id} = req.params;
    const {userId} = req.body;

    const task = await Task.findById(id);

    if(!task){
      return res.status(404).json({message:"task not found"});
    }

    const project = await Project.findById(task.projectId);

    // 3. Check if requested user is part of the project..
    const isMember = project.members
      .map((m)=>m.toString())
      .includes(userId);
    
    if(!isMember){
      return res.status(400).json({message:"user is not member to this project"});
    }

    //check if member is assigned to this task..
    const alreadyAssigned = task.assignees
      .map((m)=>m.toString())
      .includes(userId);
    
    if(!alreadyAssigned){
      return res.status(400).json({message:"user is not assign to this task"});
    }

    task.assignees = task.assignees.filter(
      (m) => m.toString() !== userId
    );

    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `task unassign: ${task.title}`,
    });

    res.status(200).json({
      status:"success",
      message:"user unassign to this task success",
      data:task
    });
  }catch(err){
    next(err);
  }
};

//----------add atachment----------------------//
const addAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    const isMember = project.members
      .map(m => m.toString())
      .includes(req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    // ✅ Cloudinary-safe check
    if (!req.file || !req.file.secure_url) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Store Cloudinary URL
    task.attachments.push(req.file.secure_url);

    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: `uploaded attachment`,
    });

    return res.status(200).json({
      status: "success",
      message: "Attachment uploaded successfully",
      data: task,
    });

  } catch (err) {
    next(err);
  }
};


// ------------------ Remove Attachment ------------------ //
const removeAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Attachment URL is required" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    const isMember = project.members
      .map(m => m.toString())
      .includes(req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    if (!task.attachments.includes(url)) {
      return res.status(400).json({ message: "Attachment not found in task" });
    }

    task.attachments = task.attachments.filter(att => att !== url);
    await task.save();

    logActivity({
      projectId: task.projectId,
      taskId: task._id,
      userId: req.user._id,
      action: "removed attachment",
    });

    return res.status(200).json({
      status: "success",
      message: "Attachment removed successfully",
      data: task,
    });

  } catch (err) {
    next(err);
  }
};



module.exports = {
  createTask, 
  getAllTask, 
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  createComments,
  deleteComments,
  assign,
  unassign,
  addAttachment,
  removeAttachment
};
