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
const Message = require("./Models/messageModel");
const Chat = require("./Models/chatModel");

dotenv.config();
connectToMongo();

const app = express();
const server = http.createServer(app); 

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
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
app.set("io", io);

const activeCalls = new Map();
const callSessions = new Map();
const callTimeouts = new Map();

const createMissedCallMessage = async (chatId, callerId, calleeId) => {
  if (!chatId || !callerId || !calleeId) return;

  const message = await Message.create({
    sender: callerId,
    content: "Missed video call",
    chat: chatId,
  });

  const fullMessage = await Message.findById(message._id)
    .populate("sender", "name pic email")
    .populate("chat")
    .populate({ path: "chat.users", select: "name pic email" });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: fullMessage._id });

  io.to(calleeId).emit("message received", fullMessage);
};


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
    const { roomId, pathData } = data || {};
    if (!roomId || !pathData) return;
    socket.in(roomId).emit("draw", pathData);
  });

  socket.on("clear", (data) => {
    const { roomId } = data || {};
    if (!roomId) return;
    socket.in(roomId).emit("clear");
  });

  socket.on("whiteboard open", ({ chatId }) => {
    if (!chatId) return;
    socket.in(chatId).emit("whiteboard open", { chatId });
  });

  socket.on("whiteboard close", ({ chatId }) => {
    if (!chatId) return;
    socket.in(chatId).emit("whiteboard close", { chatId });
  });

  socket.on("group updated", (payload) => {
    const chat = payload?.chat;
    if (!chat?.users) return;
    chat.users.forEach((chatUser) => {
      const userId = chatUser?._id || chatUser;
      if (userId) io.to(userId.toString()).emit("group updated", payload);
    });
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

  socket.on("video call request", async (payload) => {
    const { callId, chatId, fromUserId, toUserId } = payload || {};
    if (!callId || !fromUserId || !toUserId) return;

    if (activeCalls.has(toUserId)) {
      socket.emit("video call busy", { callId, toUserId });
      await createMissedCallMessage(chatId, fromUserId, toUserId);
      return;
    }

    activeCalls.set(fromUserId, callId);
    activeCalls.set(toUserId, callId);
    callSessions.set(callId, { callerId: fromUserId, calleeId: toUserId, chatId });

    const timeoutId = setTimeout(async () => {
      const session = callSessions.get(callId);
      if (!session) return;

      activeCalls.delete(session.callerId);
      activeCalls.delete(session.calleeId);
      callSessions.delete(callId);
      callTimeouts.delete(callId);

      io.to(session.callerId).emit("video call no-answer", { callId });
      await createMissedCallMessage(session.chatId, session.callerId, session.calleeId);
    }, 25000);

    callTimeouts.set(callId, timeoutId);

    io.to(toUserId).emit("video call request", payload);
  });

  socket.on("video call accept", (payload) => {
    const { callId, toUserId } = payload || {};
    if (!callId || !toUserId) return;

    const timeoutId = callTimeouts.get(callId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      callTimeouts.delete(callId);
    }
    io.to(toUserId).emit("video call accept", payload);
  });

  socket.on("video call decline", (payload) => {
    const { callId, toUserId } = payload || {};
    if (!callId || !toUserId) return;

    const session = callSessions.get(callId);
    if (session) {
      activeCalls.delete(session.callerId);
      activeCalls.delete(session.calleeId);
      callSessions.delete(callId);
    }

    const timeoutId = callTimeouts.get(callId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      callTimeouts.delete(callId);
    }

    io.to(toUserId).emit("video call decline", payload);
  });

  socket.on("video call peer", (payload) => {
    const { toUserId } = payload || {};
    if (!toUserId) return;
    io.to(toUserId).emit("video call peer", payload);
  });

  socket.on("video call end", (payload) => {
    const { callId, toUserId } = payload || {};
    if (!callId || !toUserId) return;

    const session = callSessions.get(callId);
    if (session) {
      activeCalls.delete(session.callerId);
      activeCalls.delete(session.calleeId);
      callSessions.delete(callId);
    }

    const timeoutId = callTimeouts.get(callId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      callTimeouts.delete(callId);
    }

    io.to(toUserId).emit("video call end", payload);
  });
});

// Start Server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
