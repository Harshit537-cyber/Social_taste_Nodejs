const User = require('../models/user.model');
const { Post } = require('../models/post.model')

const createUser = async (userData) => {
    return await User.create(userData);
};

const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

const findAllUsers = async () => {
    return await User.find().select("-password");
};

const findUserByIdWithoutPassword = async (userId) => {
    return await User.findById(userId).select("-password");
};

const updateUser = async (userId, updateData) => {
    return await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password");
};

const deletePostById = async (postId) => {
    return await Post.findByIdAndDelete(postId); 
};

const findPostById = async (postId) => {
    return await Post.findById(postId);
};

const deleteUserById = async (userId) => {
    return await User.findByIdAndDelete(userId);
};


module.exports = { createUser, findUserByEmail,deleteUserById , deletePostById,findPostById,findUserByIdWithoutPassword,findAllUsers,updateUser };