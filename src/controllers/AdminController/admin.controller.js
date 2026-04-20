const userService = require('../../services/user.service');
const { generateAccessToken } = require('../../utils/jwt');
const User = require('../../models/user.model');
const jwt = require('jsonwebtoken'); 

const registerAdmin = async (req, res) => {
    try {
        const { fullName, email, password, securityQuestions } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!fullName || !normalizedEmail || !password || !securityQuestions || securityQuestions.length < 3) {
            return res.status(400).json({ success: false, message: "Name, email, password and 3 security questions are required" });
        }

        const existedAdmin = await userService.findUserByEmail(normalizedEmail);
        if (existedAdmin) {
            return res.status(400).json({ success: false, message: "Admin with this email already exists" });
        }

        const admin = await User.create({
            fullName,
            email: normalizedEmail,
            password,
            role: 'admin',
            dob: new Date(),
            gender: 'Other',
            securityQuestions
        });

        const createdAdmin = await User.findById(admin._id).select("-password -securityQuestions.answer");

        return res.status(201).json({ success: true, data: createdAdmin, message: "Admin registered successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        const user = await userService.findUserByEmail(normalizedEmail);

        if (!user || user.role !== 'admin') {
            return res.status(404).json({ success: false, message: "Admin not found or unauthorized" });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user);
        const adminData = await User.findById(user._id).select("-password -securityQuestions.answer");

        return res.status(200).json({ success: true, data: { admin: adminData, accessToken }, message: "Admin login successful" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminQuestions = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.securityQuestions || user.securityQuestions.length === 0) {
            return res.status(400).json({ success: false, message: "Security questions are not set for this account" });
        }

        const questionsOnly = user.securityQuestions.map(q => ({ question: q.question }));

        return res.status(200).json({ success: true, questions: questionsOnly });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const verifySecurityAnswers = async (req, res) => {
    try {
        const { email, answers } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!answers || answers.length !== user.securityQuestions.length) {
            return res.status(400).json({ success: false, message: "Invalid number of answers provided" });
        }

        let isAllCorrect = true;
        for (let i = 0; i < user.securityQuestions.length; i++) {
            const submittedAnswer = typeof answers[i] === 'object' ? answers[i].answer : answers[i];
            const isMatch = await user.isSecurityAnswerCorrect(i, submittedAnswer);
            
            if (!isMatch) {
                isAllCorrect = false;
                break; 
            }
        }

        if (!isAllCorrect) return res.status(400).json({ success: false, message: "One or more answers are incorrect" });

        const resetToken = jwt.sign(
            { id: user._id, email: user.email }, 
            process.env.ACCESS_TOKEN_SECRET || 'secret_key', 
            { expiresIn: '15m' } 
        );

        return res.status(200).json({ success: true, message: "Answers verified successfully", resetToken });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, resetToken } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!resetToken) return res.status(401).json({ success: false, message: "Reset token is required" });

        const decoded = jwt.verify(resetToken, process.env.ACCESS_TOKEN_SECRET || 'secret_key');
        
        if (decoded.email !== normalizedEmail) {
            return res.status(403).json({ success: false, message: "Invalid token for this email" });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token expired or invalid" });
    }
};

module.exports = { registerAdmin, loginAdmin, getAdminQuestions, verifySecurityAnswers, resetPassword };