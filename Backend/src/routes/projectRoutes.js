const express = require("express");
const project = require('../controllers/projectController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

//public routes..
router.get("/public",project.getPublicProject);
router.get("/public/:id",project.getPublicProjectById);

//project routes..
router.post("/",auth,project.createProject);
router.get("/",auth,project.getAllProjects);
router.get('/:id',auth,project.getProject);
router.delete("/:id",auth,project.deleteProject);
router.patch('/:id',auth,project.updateProject);


//activity logs api..

router.get("/:id/activity",auth,project.getActivityLogs);

module.exports = router;