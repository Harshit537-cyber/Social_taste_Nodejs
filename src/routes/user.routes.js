const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const adminController = require('../controllers/AdminController/admin.controller');
const chatController = require('../controllers/chat.controller');
const followController = require('../controllers/follow.controller');
const { verifyJWT, isAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ dest: 'public/temp' });

router.post('/register', upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'portfolio', maxCount: 6 }]), userController.registerUser);
router.post('/login', userController.loginUser);

router.post('/admin/register', adminController.registerAdmin);
router.post('/admin/login', adminController.loginAdmin);

// Forgot Password Flow
router.post('/admin/forgot-password/fetch-questions', adminController.getAdminQuestions);
router.post('/admin/forgot-password/verify-answers', adminController.verifySecurityAnswers);
router.post('/admin/forgot-password/reset-password', adminController.resetPassword);

router.use(verifyJWT);

router.get("/all-users", userController.getAllUsers);
router.get("/user/:id", userController.getUserById);
router.patch("/update-profile", upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'portfolio', maxCount: 6 }]), userController.updateProfile);

router.post("/chat/send", upload.single('media'), chatController.sendMessage);
router.get("/chat/history/:friendId", chatController.getChatHistory);
router.get("/chat/recent", chatController.getRecentChats);
router.get("/chat/online-users", chatController.getOnlineUsers);
router.get('/unread-count', chatController.getUnreadMessageCount);

router.post("/follow/:targetUserId", followController.toggleFollow);
router.get("/suggestions", followController.getSuggestions);
router.get("/friends", followController.getFollowingList);
router.route("/block/:userIdToBlock").patch(verifyJWT, userController.toggleBlockUser);
router.get("/blocked-list", userController.getBlockedUsers); 

router.delete("/admin/delete-user/:id", verifyJWT, isAdmin, userController.deleteUser);
router.get("/admin/block-relationships", verifyJWT, isAdmin, userController.getAllBlockRelationships);

module.exports = router;