const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async function (req,res,next) {
    let token;

    //check if token precent in authorization headers ..
    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ){
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token){
        return res.status(401).json({message:"Not autherized, token missing"});
    }

    try{
        //verify the token..
        const decode = jwt.verify(token,process.env.JWT_SECRET);

        //fetch user details (without password)..
        const currentUser = await User.findById(decode.id).select('-password');

        if(!currentUser){
            return res.status(401).json({message:"user no longer exists"});
        }

        req.user = currentUser;

        next();
    }catch(error){
        return res.status(401).json({message:"Not autherized , invalid token " });
    }
};

module.exports = authMiddleware;