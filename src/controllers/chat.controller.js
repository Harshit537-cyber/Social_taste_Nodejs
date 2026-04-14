const Message = require('../models/message.model');
const User = require('../models/user.model');
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
};

const getChatHistory = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

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

const getRecentChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const distinctChatters = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ['$sender', userId] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    },
                    lastMessage: { $last: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'chatterInfo'
                }
            },
            {
                $unwind: '$chatterInfo'
            },
            {
                $project: {
                    _id: 0,
                    friendId: '$_id',
                    lastMessageContent: '$lastMessage.content',
                    lastMessageType: '$lastMessage.messageType',
                    lastMessageTimestamp: '$lastMessage.createdAt',
                    unreadCount: '$unreadCount',
                    friendName: '$chatterInfo.fullName',
                    friendProfilePic: '$chatterInfo.profilePic',
                    friendIsOnline: '$chatterInfo.isOnline'
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: distinctChatters,
            message: "Recent chats fetched successfully"
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

const getOnlineUsers = async (req, res) => {
    try {
        const onlineUsers = await User.find({ isOnline: true }, 'fullName profilePic');

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: onlineUsers,
            message: "Online users fetched successfully"
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


const getUnreadMessageCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const unreadCountAggregate = await Message.aggregate([
            {
                $match: {
                    receiver: userId,
                    isRead: false
                }
            },
            {
                $group: {
                    _id: "$sender" // Group by sender to count distinct unread message sources
                }
            },
            {
                $count: "distinctSendersWithUnread"
            }
        ]);

        const count = unreadCountAggregate.length > 0 ? unreadCountAggregate[0].distinctSendersWithUnread : 0;

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: { count },
            message: "Unread message count fetched successfully"
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


module.exports = { sendMessage, getChatHistory, getRecentChats, getOnlineUsers, getUnreadMessageCount  };