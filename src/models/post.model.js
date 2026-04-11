const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mediaUrl: {
            type: String,
            required: true,
        },
        mediaType: {
            type: String,
            enum: ['image', 'video'],
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Social activity",
                "Nearby deals",
                "Restaurants",
                "Business",
                "Network",
                "Student",
                "Communities",
                "Other"
            ],
        },
        title: {
            type: String,
        },
        description: {
            type: String,
            required: true,
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        comments: [
            {
                user: { type: Schema.Types.ObjectId, ref: "User" },
                content: { type: String, required: true },
                replies: [
                    {
                        user: { type: Schema.Types.ObjectId, ref: "User" },
                        content: { type: String, required: true },
                        createdAt: { type: Date, default: Date.now }
                    }
                ],
                createdAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true,
    }
);

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };