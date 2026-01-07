const Project = require("../models/projectModel");
const Activity = require("../models/activityModel");
const logActivity = require("../utils/logActivity");

/**
 * Helper: check owner
 */
const isOwner = (project, userId) => {
  if (project.owner?._id) {
    return project.owner._id.toString() === userId.toString();
  }
  return project.owner.toString() === userId.toString();
};

/**
 * Helper: check member
 */
const isMember = (project, userId) => {
  return project.members.some(m =>
    (m._id ? m._id.toString() : m.toString()) === userId.toString()
  );
};

/* ===============================
   CREATE PROJECT
================================ */
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id],
    });

    logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: `created project: ${project.name}`,
    });

    res.status(201).json({
      status: "success",
      data: project,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GET ALL USER PROJECTS
================================ */
const getAllProjects = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = {
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .skip(skip)
      .limit(limit)
      .populate("owner", "username email");

    const total = await Project.countDocuments(query);

    res.status(200).json({
      status: "success",
      count: projects.length,
      total,
      totalPage: Math.ceil(total / limit),
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   GET PUBLIC PROJECTS
================================ */
const getPublicProject = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .skip(skip)
      .limit(limit)
      .populate("owner", "username email");

    const total = await Project.countDocuments(query);

    res.status(200).json({
      status: "success",
      count: projects.length,
      total,
      page,
      totalPage: Math.ceil(total / limit),
      projects,
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================
    Get public single project
================================= */

// Get single public project (overview)
const getPublicProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .select("name description owner members createdAt")
      .populate("owner", "username")
      .populate("members", "_id"); // only for count

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        _id: project._id,
        name: project.name,
        description: project.description,
        owner: project.owner,
        membersCount: project.members.length,
        createdAt: project.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};



/* ===============================
   GET SINGLE PROJECT
================================ */
const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate("owner", "username email")
      .populate("members", "username email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 🔐 Permission: owner or member
    if (
      !isOwner(project, req.user._id) &&
      !isMember(project, req.user._id)
    ) {
      return res.status(403).json({ message: "You do not have access" });
    }

    res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   UPDATE PROJECT
================================ */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isOwner(project, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    project.name = name || project.name;
    project.description = description || project.description;

    await project.save();

    logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: `updated project: ${project.name}`,
    });

    res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   DELETE PROJECT
================================ */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isOwner(project, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You do not have permission" });
    }

    await Project.findByIdAndDelete(id);

    logActivity({
      projectId: project._id,
      userId: req.user._id,
      action: `deleted project: ${project.name}`,
    });

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   ACTIVITY LOGS
================================ */
const getActivityLogs = async (req, res, next) => {
  try {
    const { id } = req.params;

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
  getPublicProject,
  getPublicProjectById,
  getProject,
  updateProject,
  deleteProject,
  getActivityLogs,
};
