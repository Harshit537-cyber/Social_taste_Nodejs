const userService = require('../services/user.service');
const { uploadOnCloudinary } = require('../utils/cloudinary');
const { ApiResponse } = require('../utils/ApiResponse');
const { generateAccessToken } = require('../utils/jwt');

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, dob, gender, interests } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if ([fullName, normalizedEmail, password].some((field) => !field || field.trim() === "")) {
            return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
        }

        const existedUser = await userService.findUserByEmail(normalizedEmail);
        if (existedUser) {
            return res.status(400).json(new ApiResponse(400, null, "User with this email already exists"));
        }

        const profilePicLocalPath = req.files?.profilePic?.[0]?.path;
        if (!profilePicLocalPath) {
            return res.status(400).json(new ApiResponse(400, null, "Profile picture is required"));
        }

        const profilePicResponse = await uploadOnCloudinary(profilePicLocalPath);
        if (!profilePicResponse) {
            return res.status(500).json(new ApiResponse(500, null, "Error while uploading profile picture"));
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

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, null, error.message || "Internal Server Error")
        );
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json(new ApiResponse(400, null, "Email and password are required"));
        }

        const user = await userService.findUserByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User does not exist"));
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json(new ApiResponse(401, null, "Invalid user credentials"));
        }

        const accessToken = generateAccessToken(user);
        const loggedInUser = await userService.findUserByIdWithoutPassword(user._id);
        
        const userResponse = loggedInUser.toObject();
        if (userResponse.dob) {
            userResponse.dob = userResponse.dob.toISOString().split('T')[0];
        }

        return res.status(200).json(
            new ApiResponse(200, { user: userResponse, accessToken }, "Login successful")
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, null, error.message || "Internal Server Error")
        );
    }
};


const getAllUsers = async (req, res) => {
    try {
        const users = await userService.findAllUsers();

        if (!users || users.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, [], "No users found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, users, "Users fetched successfully")
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, null, error.message || "Internal Server Error")
        );
    }
};

module.exports = { registerUser, loginUser,getAllUsers };