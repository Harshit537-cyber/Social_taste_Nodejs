const userService = require('../services/user.service');
const { uploadOnCloudinary } = require('../utils/cloudinary');
const { generateAccessToken } = require('../utils/jwt');

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, dob, gender, interests } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if ([fullName, normalizedEmail, password].some((field) => !field || field.trim() === "")) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "All fields are required"
            });
        }

        const existedUser = await userService.findUserByEmail(normalizedEmail);
        if (existedUser) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "User with this email already exists"
            });
        }

        const profilePicLocalPath = req.files?.profilePic?.[0]?.path;
        if (!profilePicLocalPath) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Profile picture is required"
            });
        }

        const profilePicResponse = await uploadOnCloudinary(profilePicLocalPath);
        if (!profilePicResponse) {
            return res.status(500).json({
                success: false,
                statusCode: 500,
                data: null,
                message: "Error while uploading profile picture"
            });
        }

        let portfolioUrls = [];
        if (req.files?.portfolio?.length > 0) {
            const uploadResults = await Promise.all(
                req.files.portfolio.map(file => uploadOnCloudinary(file.path))
            );
            portfolioUrls = uploadResults.filter(res => res).map(res => res.url);
        }

        const user = await userService.createUser({
            fullName,
            email: normalizedEmail,
            password,
            dob,
            gender,
            profilePic: profilePicResponse.url,
            portfolio: portfolioUrls,
            interests: interests ? JSON.parse(interests) : []
        });

        const createdUser = await userService.findUserByIdWithoutPassword(user._id);

        return res.status(201).json({
            success: true,
            statusCode: 201,
            data: createdUser,
            message: "User registered successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            statusCode: 500,
            data: null,
            message: error.message || "Internal Server Error"
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Email and password are required"
            });
        }

        const user = await userService.findUserByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                data: null,
                message: "User does not exist"
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                data: null,
                message: "Invalid user credentials"
            });
        }

        const accessToken = generateAccessToken(user);
        const loggedInUser = await userService.findUserByIdWithoutPassword(user._id);
        
        const userResponse = loggedInUser.toObject();
        if (userResponse.dob) {
            userResponse.dob = userResponse.dob.toISOString().split('T')[0];
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: { user: userResponse, accessToken },
            message: "Login successful"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            statusCode: 500,
            data: null,
            message: error.message || "Internal Server Error"
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.findAllUsers();

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                data: [],
                message: "No users found"
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: users,
            message: "Users fetched successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            statusCode: 500,
            data: null,
            message: error.message || "Internal Server Error"
        });
    }

};


const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.findUserByIdWithoutPassword(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                statusCode: 404,
                data: null,
                message: "User not found"
            });
        }

        const userResponse = user.toObject();
        if (userResponse.dob) {
            userResponse.dob = userResponse.dob.toISOString().split('T')[0];
        }

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: userResponse,
            message: "User details fetched successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            statusCode: 500,
            data: null,
            message: error.message || "Internal Server Error"
        });
    }
}

module.exports = { registerUser, loginUser, getAllUsers ,getUserById };