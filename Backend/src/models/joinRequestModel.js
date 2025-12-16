const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);


const ProjectJoinRequest = mongoose.model("joinRequestSchema",joinRequestSchema);

module.exports = ProjectJoinRequest;
