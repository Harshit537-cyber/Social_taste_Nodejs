require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const { app } = require('./app');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
});

const userSocketMap = {}; 

io.on("connection", (socket) => {
    socket.on("join", (userId) => {
        userSocketMap[userId] = socket.id;
    });

    socket.on("send_message", (data) => {
        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", data);
        }
    });

    socket.on("disconnect", () => {
        const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (userId) delete userSocketMap[userId];
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