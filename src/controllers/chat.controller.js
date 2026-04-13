const Message = require('../models/message.model');
const {ApiResponse} = require('../utils/ApiResponse');

const {uploadOnCloudinary} = require('../utils/cloudinary');

const sendMessage = async(req,res)=>{

    try {
        
        const {receiverId, content , messageType}= req.body
        const senderId = req.user._id;

        let finalContent = content;

        if (messageType === 'image' || messageType === 'video') {
            if (!req.file) return res.status(400).json(new ApiResponse(400, null, "Media file is required"));

            const uploadResult = await uploadOnCloudinary(req.file.path);
            finalContent = uploadResult.url;
        }

        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            messageType: messageType || 'text',
            content: finalContent
        });

         return res.status(201).json(new ApiResponse(201, newMessage, "Message sent"));

    } catch (error) {
         return res.status(500).json(new ApiResponse(500, null, error.message));
    }
}


const getChatHistory = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        // 1. Saare unread messages jo mujhe (userId) bheje gaye hain unhe true kar do
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

        // 2. Phir saari history fetch karo
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json(new ApiResponse(200, messages, "Chat history fetched and marked as read"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};

module.exports = { sendMessage, getChatHistory };
