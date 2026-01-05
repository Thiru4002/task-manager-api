const User = require('../models/userModel');
const {generateToken} = require('../utils/token');
const Project = require("../models/projectModel");
const Task = require("../models/taskModel");
const Activity = require("../models/activityModel");


//-------------------register......................//
const register = async (req,res) => {
    try{
        const {username,email,password} = req.body;

        //check all field..
        if(!username || !email || !password){
            return res.status(400).json({message:"All field are required"});
        }

        //check duplicate user..
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message:"user alredy exists"});
        }

        //create user..
        const user = await User.create({username,email,password});

        //generate token..
        const token = generateToken(user._id);

        //respose..
        res.status(201).json({
            status:'success',
            data:{
                user:{
                    id:user._id,
                    username:user.username,
                    email:user.email,
                },
                token,
            },
        });
    }catch(error){
        res.status(500).json({message:error.message});
    }
};

//----------------login..
const login = async (req,res) => {
    try{
        const {email,password} = req.body;

        //check field..
        if(!email || !password){
            return res.status(400).json({message:"email & password are required"});
        }

        const user = await User.findOne({email}).select('+password');
        if(!user){
            return res.status(404).json({message:"user not found"});
        }

        //compare password..
        const isMatch = await user.comparePassword(password);

        if(!isMatch){
            return res.status(400).json({message:"invalid email or password"});
        }

        const token = generateToken(user._id);

        //respose..
        res.status(200).json({
            status:"success",
            data:{
                user:{
                    id:user._id,
                    username:user.username,
                    email:user.email,
                },
                token,
            },
        });
    }catch(error){
        res.status(500).json({message:error.message});
    }
};

// -----------------Dashboard Stats--------------//
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total projects user belongs to
    const totalProjects = await Project.countDocuments({
      $or: [{ owner: userId }, { members: userId }],
    });

    // Total tasks assigned to user
    const assignedTasks = await Task.countDocuments({
      assignees: userId,
    });

    // Total tasks created by user
    const createdTasks = await Task.countDocuments({
      creator: userId,
    });

    // Completed tasks
    const completedTasks = await Task.countDocuments({
      assignees: userId,
      status: "done",
    });

    // Pending tasks (todo + in-progress)
    const pendingTasks = await Task.countDocuments({
      assignees: userId,
      status: { $ne: "done" },
    });

    // Tasks created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksToday = await Task.countDocuments({
      creator: userId,
      createdAt: { $gte: today },
    });

    // Tasks created this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const tasksThisWeek = await Task.countDocuments({
      creator: userId,
      createdAt: { $gte: weekAgo },
    });

    // Recent activity count (last 7 days)
    const recentActivity = await Activity.countDocuments({
      userId,
      createdAt: { $gte: weekAgo },
    });

    res.status(200).json({
      status: "success",
      data: {
        totalProjects,
        assignedTasks,
        createdTasks,
        completedTasks,
        pendingTasks,
        tasksToday,
        tasksThisWeek,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// userController.js
const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email }).select("_id username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: user
    });
  } catch (err) {
    next(err);
  }
};


module.exports = {register,login,getDashboard,getUserByEmail};