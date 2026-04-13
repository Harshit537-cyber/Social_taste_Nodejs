const User = require('../models/user.model');

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

module.exports = { createUser, findUserByEmail, findUserByIdWithoutPassword,findAllUsers };