const { Router } = require("express");
const { createPost, getAllPosts, toggleLike, addComment,addReply} = require("../controllers/post.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllPosts);

router.route("/create").post(
    upload.single("media"),
    createPost
);


router.route("/like/:postId").post(verifyJWT, toggleLike);


router.route("/comment/:postId").post(verifyJWT, addComment);

router.route("/comment/reply/:postId/:commentId").post(verifyJWT, addReply);

module.exports = router;