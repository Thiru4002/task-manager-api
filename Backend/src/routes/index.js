const express = require('express');
const userRoutes = require('./UserRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require("./taskRoutes");
const uploadRoutes = require("./uploadRoutes");
const memberShipRoutes = require('./projectMembershipRoutes');

const router = express.Router();

router.use('/auth',userRoutes);
router.use('/projects',projectRoutes);
router.use("/tasks",taskRoutes);
router.use("/upload",uploadRoutes);
router.use('/membership',memberShipRoutes);

module.exports=router;