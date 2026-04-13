const multer = require("multer");
const path = require("path");
const fs = require("fs"); // File system module import kiya

// Folder ka path ek variable mein rakh liya taaki clean dikhe
const tempDir = "./src/public/temp";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 1. Check karega: Kya folder exist karta hai?
        // 2. Agar nahi karta, toh turant naya bana dega (recursive: true se saare parent folders bhi ban jayenge agar missing hue)
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // 3. Folder pakka ban gaya hai, ab file wahan save kar do
        cb(null, tempDir); 
    },
    filename: function (req, file, cb) {
        // Unique name generate karne ka logic
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

module.exports = { upload };