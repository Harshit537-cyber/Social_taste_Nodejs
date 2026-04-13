const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    // Agar env se nahi mila to temporary string use hogi (sirf test ke liye)
    const secret = process.env.ACCESS_TOKEN_SECRET || "TEMP_SECRET_KEY_FOR_TESTING";
    
    return jwt.sign(
        {
            _id: user._id,
            email: user.email,
            role: user.role
        },
        secret,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '7d'
        }
    );
};