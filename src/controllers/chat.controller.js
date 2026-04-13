const Message = require('../models/message.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, messageType } = req.body;
        const senderId = req.user._id;

        let finalContent = content;

        if (messageType === 'image' || messageType === 'video') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    data: null,
                    message: "Media file is required"
                });
            }

            const uploadResult = await uploadOnCloudinary(req.file.path);
            finalContent = uploadResult.url;
        }

        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            messageType: messageType || 'text',
            content: finalContent
        });

        return res.status(201).json({
            success: true,
            statusCode: 201,
            data: newMessage,
            message: "Message sent"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            statusCode: 500,
            data: null,
            message: error.message
        });
    }
}

const getChatHistory = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        // 1. Saare unread messages ko read mark karein
        await Message.updateMany(
            { 
                sender: friendId, 
                receiver: userId, 
                isRead: false 
            },
            { 
                $set: { isRead: true } 
            }
        );

        // 2. Chat history fetch karein
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: messages,
            message: "Chat history fetched and marked as read"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            statusCode: 500,
            data: null,
            message: error.message
        });
    }
};

module.exports = { sendMessage, getChatHistory };