const Project = require("../models/projectModel");
const ProjectJoinRequest = require("../models/joinRequestModel");
const User = require("../models/userModel");

/* ===============================
   HELPERS
================================ */
const isOwner = (project, userId) =>
  (project.owner._id
    ? project.owner._id.toString()
    : project.owner.toString()) === userId.toString();

const isMember = (project, userId) =>
  project.members.some(m =>
    (m._id ? m._id.toString() : m.toString()) === userId.toString()
  );

const populateProject = (projectId) =>
  Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members", "username email");

/* ===============================
   REQUEST TO JOIN PROJECT
================================ */
const requestToJoinProject = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (isMember(project, userId)) {
      return res.status(400).json({
        message: "You are already a member of this project",
      });
    }

    const existingRequest = await ProjectJoinRequest.findOne({
      projectId,
      userId,
    });

    if (existingRequest && existingRequest.status === "pending") {
      return res.status(400).json({
        message: "Join request already pending",
      });
    }

    const joinRequest = await ProjectJoinRequest.create({
      projectId,
      userId,
      status: "pending",
    });

    res.status(200).json({
      status: "success",
      message: "Join request sent successfully",
      data: joinRequest,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   GET JOIN REQUESTS
================================ */
const getJoinRequests = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isOwner(project, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const requests = await ProjectJoinRequest.find({
      projectId,
      status: "pending",
    }).populate("userId", "username email");

    res.status(200).json({
      status: "success",
      totalRequests: requests.length,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   APPROVE / REJECT JOIN REQUEST
================================ */
const handleJoinRequest = async (req, res, next) => {
  try {
    const { id: projectId, requestId } = req.params;
    const { action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isOwner(project, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const request = await ProjectJoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Join request not found" });
    }

    if (request.projectId.toString() !== projectId) {
      return res.status(400).json({
        message: "Request does not belong to this project",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request already processed",
      });
    }

    if (action === "approve") {
      if (!isMember(project, request.userId)) {
        project.members.push(request.userId);
        await project.save();
      }

      request.status = "approved";
      await request.save();

      const populatedProject = await populateProject(project._id);

      return res.status(200).json({
        status: "success",
        message: "User approved and added to project",
        data: populatedProject,
      });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({
      status: "success",
      message: "Join request rejected",
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   ADD MEMBER
================================ */
const addMember = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isOwner(project, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isMember(project, userId)) {
      return res.status(400).json({
        message: "User is already a member of this project",
      });
    }

    project.members.push(userId);
    await project.save();

    const populatedProject = await populateProject(project._id);

    res.status(200).json({
      status: "success",
      message: "User added successfully",
      data: populatedProject,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   REMOVE MEMBER
================================ */
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isOwner(project, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (
      (project.owner._id
        ? project.owner._id.toString()
        : project.owner.toString()) === userId
    ) {
      return res.status(400).json({
        message: "Owner cannot be removed from the project",
      });
    }

    if (!isMember(project, userId)) {
      return res.status(400).json({
        message: "User is not a member of this project",
      });
    }

    project.members = project.members.filter(
      m => (m._id ? m._id.toString() : m.toString()) !== userId
    );

    await project.save();

    const populatedProject = await populateProject(project._id);

    res.status(200).json({
      status: "success",
      message: "User removed from project",
      data: populatedProject,
    });
  } catch (err) {
    next(err);
  }
};

/* ===============================
   EXPORTS
================================ */
module.exports = {
  requestToJoinProject,
  getJoinRequests,
  handleJoinRequest,
  addMember,
  removeMember,
};
