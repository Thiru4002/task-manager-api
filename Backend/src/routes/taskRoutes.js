const express = require("express");
const task = require("../controllers/taskController");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

/* ================================
   TASK CORE ROUTES
================================ */

// Create task
router.post("/", auth, task.createTask);

// Get all tasks (filters, pagination)
router.get("/", auth, task.getAllTask);

// Get single task
router.get("/:id", auth, task.getTask);

// Update task fields (title, description, priority, etc.)
router.patch("/:id", auth, task.updateTask);

// Update only task status
router.patch("/:id/status", auth, task.updateTaskStatus);

// Delete task
router.delete("/:id", auth, task.deleteTask);

/* ================================
   COMMENT ROUTES
================================ */

// Create comment on task
router.post("/:id/comments", auth, task.createComments);

// Delete comment
router.delete("/:id/comments/:commentId", auth, task.deleteComments);

/* ================================
   ASSIGN / UNASSIGN ROUTES
================================ */

router.patch("/:id/assign", auth, task.assign);
router.patch("/:id/unassign", auth, task.unassign);

/* ================================
   ATTACHMENT ROUTES
================================ */

// Upload attachment
router.post("/:id/attachments", auth,upload.single("file"), task.addAttachment);

// Remove attachment
router.delete("/:id/attachments", auth, task.removeAttachment);

module.exports = router;
