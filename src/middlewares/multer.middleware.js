const multer = require("multer");
const path = require("path"); // path module ko import karein

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Agar folder src ke andar hai toh path aisa hoga:
        cb(null, "./src/public/temp"); 
    },
    filename: function (req, file, cb) {
        // unique name dene ke liye suffix laga sakte hain (optional)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
});

module.exports = { upload };