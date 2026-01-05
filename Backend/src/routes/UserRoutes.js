const express = require('express');
const user = require('../controllers/userController');
const auth = require("../middleware/authMiddleware");

const router = express.Router();

//auth routes..

router.post('/register',user.register);
router.post('/login',user.login);
router.get("/by-email", auth,user.getUserByEmail);


//dashBoard status ............
router.get("/dashboard/stats",auth,user.getDashboard);

module.exports = router;