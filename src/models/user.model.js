const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: 'default_profile_pic_url' },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    portfolio: [{ type: String }],
    interests: {
        outdoorAdventure: [{ type: String }],
        sportsFitness: [{ type: String }],
        musicArts: [{ type: String }],
        moviesShows: [{ type: String }],
        foodDrink: [{ type: String }]
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    securityQuestions: [{
        question: { type: String, required: true },
        answer: { type: String, required: true }
    }],
    isOnline: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified('securityQuestions')) {
        for (let i = 0; i < this.securityQuestions.length; i++) {
            if (this.securityQuestions[i].isModified('answer')) {
                const plainAnswer = this.securityQuestions[i].answer.trim().toLowerCase();
                this.securityQuestions[i].answer = await bcrypt.hash(plainAnswer, 10);
            }
        }
    }
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.isSecurityAnswerCorrect = async function (index, submittedAnswer) {
    if (!this.securityQuestions[index]) return false;
    const storedHash = this.securityQuestions[index].answer;
    return await bcrypt.compare(submittedAnswer.trim().toLowerCase(), storedHash);
};

module.exports = mongoose.model('User', userSchema);