const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const { ApiError } = require("../utils/ApiError.js");

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id).select("-password");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
        
    } catch (error) {
        next(new ApiError(401, error?.message || "Invalid access token"));
    }
};


const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access Denied: Admin rights required"
        });
    }
};


module.exports = { verifyJWT ,isAdmin};