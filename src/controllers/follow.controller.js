const User = require('../models/user.model');
const { ApiResponse } = require('../utils/ApiResponse');

const toggleFollow = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user._id;

        if (userId.toString() === targetUserId) {
            return res.status(400).json(new ApiResponse(400, null, "You cannot follow yourself"));
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

      
        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            currentUser.following.pull(targetUserId);
            targetUser.followers.pull(userId);
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(userId);
        }

        await currentUser.save();
        await targetUser.save();

        return res.status(200).json(
            new ApiResponse(200, null, isFollowing ? "Unfollowed successfully" : "Followed successfully")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};

const getSuggestions = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        const followingList = user.following || [];
        const excludedIds = [...followingList, userId];

        const suggestions = await User.aggregate([
            { $match: { _id: { $nin: excludedIds } } },
            { $sample: { size: 10 } },
            {
                $project: {
                    fullName: 1,
                    profilePic: 1,
                    mutualFriendsCount: {
                        $size: {
                            $setIntersection: [
                                { $ifNull: ["$followers", []] }, 
                                followingList
                            ]
                        }
                    }
                }
            },
            { $sort: { mutualFriendsCount: -1 } }
        ]);

        return res.status(200).json(new ApiResponse(200, suggestions, "Suggestions fetched successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};

const getFollowingList = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("following", "fullName profilePic email");
        
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        return res.status(200).json(new ApiResponse(200, user.following || [], "Friends list fetched successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }
};

module.exports = { toggleFollow, getSuggestions, getFollowingList };