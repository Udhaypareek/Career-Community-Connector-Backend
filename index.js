const dotenv = require("dotenv");
const connectToMongo = require('./config/db');
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io");
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectToMongo();

const app = express();
const server = http.createServer(app); 

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL ,
  credentials: true,
}));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

// Initialize Socket.IOs
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("Connected to Socket.IO");

  socket.on("setup", (userData) => {
    if (userData && userData._id) {
      socket.join(userData._id);
      socket.emit("connected");
    }
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User Joined Room: ${room}`);
  });

   // Listen for drawing events
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
    console.log(`whiteboard draw : ${data}`)
  });

  socket.on("clear", () => {
    io.emit("clear");
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    if (!chat?.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

// Start Server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
