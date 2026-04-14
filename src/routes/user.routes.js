const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { sendMessage, getChatHistory } = require('../controllers/chat.controller');
const { toggleFollow, getSuggestions, getFollowingList } = require('../controllers/follow.controller');
const { verifyJWT } = require('../middlewares/auth.middleware'); 
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'portfolio', maxCount: 6 }
]), userController.registerUser);

router.post('/login', userController.loginUser);

router.route("/all-users").get(userController.getAllUsers);
router.route("/user/:id").get(userController.getUserById);


router.use(verifyJWT); 

router.route("/chat/send").post(upload.single('media'), sendMessage);
router.route("/chat/history/:friendId").get(getChatHistory);


router.route("/follow/:targetUserId").post(toggleFollow);
router.route("/suggestions").get(getSuggestions);
router.route("/friends").get(getFollowingList);

module.exports = router;