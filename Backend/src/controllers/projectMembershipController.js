const Project = require("../models/projectModel");
const ProjectJoinRequest = require("../models/joinRequestModel");
const User = require("../models/userModel");
// -------- User requests to join a project --------
const requestToJoinProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    // 1️⃣ Check project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2️⃣ If user already a member
    const isMember = project.members.some(
      (m) => m.toString() === userId.toString()
    );

    if (isMember) {
      return res.status(400).json({
        message: "You are already a member of this project",
      });
    }

    // 3️⃣ Check existing request (USER + PROJECT)
    const existingRequest = await ProjectJoinRequest.findOne({
      projectId,
      userId,
    });

    // 4️⃣ BLOCK ONLY IF PENDING
    if (existingRequest && existingRequest.status === "pending") {
      return res.status(400).json({
        message: "Join request already pending",
      });
    }

    // 5️⃣ Create new join request
    const joinRequest = await ProjectJoinRequest.create({
      projectId,
      userId,
      status: "pending",
    });

    return res.status(200).json({
      status: "success",
      message: "Join request sent successfully",
      data: joinRequest,
    });

  } catch (err) {
    next(err);
  }
};


// -------- Owner/Admin sees pending join requests --------
const getJoinRequests = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // 1️⃣ Check project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2️⃣ Only owner or admin can see requests
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 3️⃣ Fetch pending requests
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

// -------- Owner/Admin approves or rejects join request --------
const handleJoinRequest = async (req, res, next) => {
  try {
    const { id: projectId, requestId } = req.params;
    const { action } = req.body; // "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    // 1️⃣ Check project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2️⃣ Only owner or admin can decide
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 3️⃣ Find join request
    const request = await ProjectJoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Join request not found" });
    }

    // 4️⃣ Ensure request belongs to this project
    if (request.projectId.toString() !== projectId) {
      return res.status(400).json({ message: "Request does not belong to this project" });
    }

    // 5️⃣ Prevent double processing
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // 6️⃣ APPROVE
    if (action === "approve") {
      // Avoid duplicate member add
      const alreadyMember = project.members
        .map(m => m.toString())
        .includes(request.userId.toString());

      if (!alreadyMember) {
        project.members.push(request.userId);
        await project.save();
      }

      request.status = "approved";
      await request.save();

      return res.status(200).json({
        status: "success",
        message: "User approved and added to project",
      });
    }

    // 7️⃣ REJECT
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


//-----------add member------------//
const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // 1. Find project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "project is not found" });
    }

    // 2. Only owner or admin can add members
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "you do not have permission" });
    }

    // 3. Check if user exists in DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found in database" });
    }

    // 4. Check if user is already a member
    const alreadyMember = project.members
      .map((m) => m.toString())
      .includes(userId);

    if (alreadyMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this project" });
    }

    // 5. Add member
    project.members.push(userId);

    await project.save();


    res.status(200).json({
      status: "success",
      message: "User added successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

//-----------remove member-----------//
const removeMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // 1. Find project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "project is not found" });
    }

    // 2. Only owner or admin can remove members
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "you don't have permission" });
    }

    // 3. Check user exists in DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user is not present in the DB" });
    }

    // 4. Cannot remove owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: "Owner cannot be removed from the project" });
    }

    // 5. Check if user is a member
    const isMember = project.members
      .map((m) => m.toString())
      .includes(userId);

    if (!isMember) {
      return res.status(400).json({ message: "User is not a member of this project" });
    }

    // 6. Remove user
    project.members = project.members.filter(
      (m) => m.toString() !== userId
    );

    await project.save();

    res.status(200).json({
      status: "success",
      message: "User removed from project",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestToJoinProject,
  getJoinRequests,
  handleJoinRequest,
  addMember,
  removeMember
};