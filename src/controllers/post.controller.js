const { ApiError } = require("../utils/ApiError");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { Post } = require("../models/post.model");
const mongoose = require("mongoose");

const createPost = async (req, res) => {
    try {
        const { category, title, description } = req.body;
        if (!category || !description) throw new ApiError(400, "Required fields missing");

        const mediaFileLocalPath = req.file?.path;
        if (!mediaFileLocalPath) throw new ApiError(400, "Media file required");

        const mediaFile = await uploadOnCloudinary(mediaFileLocalPath);
        if (!mediaFile?.url) throw new ApiError(500, "Upload failed");

        const post = await Post.create({
            owner: req.user?._id,
            mediaUrl: mediaFile.url,
            mediaType: mediaFile.resource_type,
            category,
            title: title || "",
            description,
        });

        const createdPost = await Post.findById(post._id).populate("owner", "fullName profilePic");
        
        return res.status(201).json({
            success: true,
            statusCode: 201,
            data: createdPost,
            message: "Post created"
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            statusCode: error.statusCode || 500,
            message: error.message || "Internal Server Error" 
        });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) query.category = category;

        const posts = await Post.find(query)
            .populate("owner", "fullName profilePic")
            .populate("comments.user", "fullName profilePic")
            .populate("comments.replies.user", "fullName profilePic") 
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: posts,
            message: "Posts fetched"
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            statusCode: 500,
            message: error.message || "Internal Server Error" 
        });
    }
};

const toggleLike = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) throw new ApiError(404, "Post not found");

        const isLiked = post.likes.includes(req.user?._id);
        isLiked ? post.likes.pull(req.user?._id) : post.likes.push(req.user?._id);

        await post.save();

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: post.likes,
            message: isLiked ? "Unliked" : "Liked"
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            statusCode: error.statusCode || 500,
            message: error.message 
        });
    }
};

const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        if (!content) throw new ApiError(400, "Comment content is required");

        const post = await Post.findById(postId);
        if (!post) throw new ApiError(404, "Post not found");

        post.comments.push({ user: req.user?._id, content });
        await post.save();

        const updatedPost = await Post.findById(postId).populate("comments.user", "fullName profilePic");
        
        return res.status(201).json({
            success: true,
            statusCode: 201,
            data: updatedPost.comments,
            message: "Comment added"
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            statusCode: error.statusCode || 500,
            message: error.message 
        });
    }
};

const addReply = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content } = req.body;

        if (!content) throw new ApiError(400, "Reply content is required");

        const post = await Post.findById(postId);
        if (!post) throw new ApiError(404, "Post not found");

        const comment = post.comments.id(commentId);
        if (!comment) throw new ApiError(404, "Comment not found");

        comment.replies.push({
            user: req.user?._id,
            content
        });

        await post.save();

        const updatedPost = await Post.findById(postId)
            .populate("comments.user", "fullName profilePic")
            .populate("comments.replies.user", "fullName profilePic");

        return res.status(201).json({
            success: true,
            statusCode: 201,
            data: updatedPost.comments,
            message: "Reply added successfully"
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            statusCode: error.statusCode || 500,
            message: error.message 
        });
    }
};

module.exports = { createPost, getAllPosts, toggleLike, addComment, addReply };