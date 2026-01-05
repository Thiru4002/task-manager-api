const Task = require("../models/taskModel");
const Project = require("../models/projectModel");
const logActivity = require("../utils/logActivity");

/* ===============================
   HELPERS
================================ */
const isMember = (project, userId) =>
  project.members.some(m => m.toString() === userId.toString());

/* ===============================
   CREATE TASK
================================ */
const createTask = async (req, res) => {
  const { title, description, projectId, priority, dueDate } = req.body;

  if (!title || !projectId)
    return res.status(400).json({ message: "Title and projectId required" });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (!isMember(project, req.user._id))
    return res.status(403).json({ message: "Not a project member" });

  const task = await Task.create({
    title,
    description,
    projectId,
    priority,
    dueDate,
    creator: req.user._id,
  });

  const populated = await Task.findById(task._id)
    .populate("creator", "username")
    .populate("assignees", "username")
    .populate({ path: "projectId", select: "owner" });

  logActivity({
    projectId,
    taskId: task._id,
    userId: req.user._id,
    action: `created task: ${task.title}`,
  });

  res.status(201).json({ status: "success", data: populated });
};

/* ===============================
   GET ALL TASKS
================================ */
const getAllTask = async (req, res) => {
  const { projectId, status, priority, search } = req.query;

  const query = {};
  if (projectId) query.projectId = projectId;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) query.title = { $regex: search, $options: "i" };

  const tasks = await Task.find(query)
    .populate("creator", "username")
    .populate("assignees", "username")
    .populate({ path: "projectId", select: "owner" })
    .sort({ createdAt: -1 });

  res.json({ status: "success", data: tasks });
};

/* ===============================
   GET SINGLE TASK
================================ */
const getTask = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("creator", "username")
    .populate("assignees", "username")
    .populate("comments.user", "username")
    .populate({ path: "projectId", select: "owner" });

  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findById(task.projectId._id);
  if (!isMember(project, req.user._id))
    return res.status(403).json({ message: "Access denied" });

  res.json({ status: "success", data: task });
};

/* ===============================
   UPDATE TASK (NO STATUS HERE)
================================ */
const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findById(task.projectId);

  const isOwner = project.owner.toString() === req.user._id.toString();
  const isCreator = task.creator.toString() === req.user._id.toString();

  if (!isOwner && !isCreator)
    return res.status(403).json({ message: "Not allowed" });

  const { title, description, priority, dueDate } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();

  const populated = await Task.findById(task._id)
    .populate("creator", "username")
    .populate("assignees", "username")
    .populate({ path: "projectId", select: "owner" });

  res.json({ status: "success", data: populated });
};

/* ===============================
   UPDATE STATUS (ONLY HERE)
================================ */
const updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  if (!["todo", "in-progress", "done"].includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findById(task.projectId);

  const isOwner = project.owner.toString() === req.user._id.toString();
  const isCreator = task.creator.toString() === req.user._id.toString();
  const isAssignee = task.assignees.some(a => a.toString() === req.user._id.toString());

  if (!isOwner && !isCreator && !isAssignee)
    return res.status(403).json({ message: "Not allowed" });

  task.status = status;
  await task.save();

  res.json({ status: "success", data: task });
};


/* ===============================
   DELETE TASK
================================ */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);

    if (
      task.creator.toString() !== req.user._id.toString() &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await task.deleteOne();
    res.status(200).json({ status: "success", message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* ===============================
   COMMENTS
================================ */
const createComments = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const task = await Task.findById(req.params.id)
      .populate("project", "name")
      .populate("creator", "username")
      .populate("assignedTo", "username")
      .sort({ createdAt: -1 });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    if (!isMember(project, req.user._id)) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    task.comments.push({ user: req.user._id, text });
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("comments.user", "username");

    res.status(201).json({ status: "success", data: populatedTask });
  } catch (err) {
    next(err);
  }
};

const deleteComments = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    comment.deleteOne();
    await task.save();

    res.status(200).json({ status: "success", message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   ASSIGN / UNASSIGN
================================ */
const assign = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCreator = task.creator.toString() === req.user._id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "Only owner or creator can assign" });
    }

    if (!isMember(project, userId)) {
      return res.status(400).json({ message: "User is not a project member" });
    }

    if (task.assignees.some(a => a.toString() === userId)) {
      return res.status(400).json({ message: "User already assigned" });
    }

    task.assignees.push(userId);
    await task.save();

    res.status(200).json({ status: "success", data: task });
  } catch (err) {
    next(err);
  }
};

const unassign = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.assignees = task.assignees.filter(a => a.toString() !== userId);
    await task.save();

    res.status(200).json({ status: "success", data: task });
  } catch (err) {
    next(err);
  }
};

const getMyAssignedTasks = async (req, res) => {
  const userId = req.user.id;

  const tasks = await Task.find({
    assignedTo: userId
  })
    .populate("project", "name")
    .populate("creator", "username")
    .populate("assignedTo", "username")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks
  });
};


/* ===============================
   ATTACHMENTS
================================ */
const addAttachment = async (req, res, next) => {
  try {
    // ✅ CORRECT guard for Cloudinary
    if (!req.file || !req.file.secure_url) {
      return res.status(400).json({ message: "File upload failed" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.attachments.push({
      url: req.file.secure_url,     // ✅ MUST be secure_url
      name: req.file.originalname,  // ✅ original filename
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    });

    await task.save();

    res.status(201).json({
      status: "success",
      data: task,
    });
  } catch (err) {
    next(err);
  }
};



const removeAttachment = async (req, res, next) => {
  try {
    const { url } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    if (!isMember(project, req.user._id)) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    task.attachments = task.attachments.filter(att => att.url !== url);
    await task.save();

    res.status(200).json({ status: "success", data: task });
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
  getMyAssignedTasks,
  removeAttachment,
};
