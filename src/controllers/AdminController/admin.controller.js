const userService = require('../../services/user.service');
const { generateAccessToken } = require('../../utils/jwt');
const User = require('../../models/user.model');

const registerAdmin = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!fullName || !normalizedEmail || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Name, email and password are required" 
            });
        }

        const existedAdmin = await userService.findUserByEmail(normalizedEmail);
        if (existedAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: "Admin with this email already exists" 
            });
        }

        const admin = await User.create({
            fullName,
            email: normalizedEmail,
            password,
            role: 'admin',
            dob: new Date(),
            gender: 'Other'
        });

        const createdAdmin = await User.findById(admin._id).select("-password");

        return res.status(201).json({
            success: true,
            data: createdAdmin,
            message: "Admin registered successfully"
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        const user = await userService.findUserByEmail(normalizedEmail);

        if (!user || user.role !== 'admin') {
            return res.status(404).json({ 
                success: false, 
                message: "Admin not found or unauthorized" 
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        const accessToken = generateAccessToken(user);
        const adminData = await User.findById(user._id).select("-password");

        return res.status(200).json({
            success: true,
            data: { admin: adminData, accessToken },
            message: "Admin login successful"
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = { registerAdmin, loginAdmin };