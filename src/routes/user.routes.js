const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'portfolio', maxCount: 6 }
]), userController.registerUser);

module.exports = router;