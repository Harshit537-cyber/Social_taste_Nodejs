const User = require('../models/user.model');

const createUser = async (userData) => {
    return await User.create(userData);
};

const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

module.exports = { createUser, findUserByEmail };