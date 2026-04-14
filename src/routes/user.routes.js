const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const chatController = require('../controllers/chat.controller'); // Renamed to message.controller as per previous conversation
const followController = require('../controllers/follow.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ dest: 'public/temp' }); // Changed destination to a public temporary folder

// User Authentication and Registration Routes (No Auth Required)
router.post('/register', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'portfolio', maxCount: 6 }
]), userController.registerUser);

router.post('/login', userController.loginUser);

// Routes Requiring Authentication
router.use(verifyJWT);

// User Profile Routes (Auth Required)
router.get("/all-users", userController.getAllUsers);
router.get("/user/:id", userController.getUserById);

// Chat Routes (Auth Required)
router.post("/chat/send", upload.single('media'), chatController.sendMessage);
router.get("/chat/history/:friendId", chatController.getChatHistory);
router.get("/chat/recent", chatController.getRecentChats);
router.get("/chat/online-users", chatController.getOnlineUsers);

// Follow Routes (Auth Required)
router.post("/follow/:targetUserId", followController.toggleFollow);
router.get("/suggestions", followController.getSuggestions);
router.get("/friends", followController.getFollowingList);

module.exports = router;