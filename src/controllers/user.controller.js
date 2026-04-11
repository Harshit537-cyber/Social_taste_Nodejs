const userService = require('../services/user.service');
const { uploadOnCloudinary } = require('../utils/cloudinary');
const ApiResponse = require('../utils/apiResponse');

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, dob, gender, interests } = req.body;

        const existedUser = await userService.findUserByEmail(email);
        if (existedUser) return res.status(400).json(new ApiResponse(400, null, "Email already exists"));

        const profilePicLocalPath = req.files?.profilePic?.[0]?.path;
        if (!profilePicLocalPath) return res.status(400).json(new ApiResponse(400, null, "Profile pic is required"));

        const profilePicUrl = await uploadOnCloudinary(profilePicLocalPath);

        let portfolioUrls = [];
        if (req.files?.portfolio && req.files.portfolio.length > 0) {
            for (const file of req.files.portfolio) {
                const url = await uploadOnCloudinary(file.path);
                if (url) portfolioUrls.push(url);
            }
        }

        const user = await userService.createUser({
            fullName,
            email,
            password,
            dob,
            gender,
            profilePic: profilePicUrl,
            portfolio: portfolioUrls,
            interests: JSON.parse(interests)
        });

        const createdUser = await userService.findUserByIdWithoutPassword(user._id);

        return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json(new ApiResponse(400, null, "Email and password are required"));
        
        const user = await userService.findUserByEmail(email);
        if (!user) return res.status(404).json(new ApiResponse(404, null, "User does not exist"));

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) return res.status(401).json(new ApiResponse(401, null, "Invalid credentials"));

        const accessToken = generateAccessToken(user);
        const loggedInUser = await userService.findUserByIdWithoutPassword(user._id);

        return res.status(200).json(
            new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};



module.exports = { registerUser,loginUser };