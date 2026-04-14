require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const { app } = require('./app');
const User = require('./src/models/user.model');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
});

const userSocketMap = {}; 

io.on("connection", (socket) => {
    socket.on("join", async (userId) => {
        if (!userId) return;
        
        userSocketMap[userId] = socket.id;
        
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status_update", { userId, isOnline: true });
    });

    socket.on("send_message", (data) => {
        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", data);
        }
    });

    socket.on("disconnect", async () => {
        const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        
        if (userId) {
            delete userSocketMap[userId];
            await User.findByIdAndUpdate(userId, { isOnline: false });
            io.emit("user_status_update", { userId, isOnline: false });
        }
    });
});

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });