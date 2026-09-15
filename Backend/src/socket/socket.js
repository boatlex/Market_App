import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

// Keep this object local to this file for safety
const userSocketMap = {}; 

// Export a clean helper function for your controllers to use
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};


export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });


  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.userId = decoded.userId; 
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // 2. Event Connections
  io.on("connection", (socket) => {
    const userId = socket.userId;
    
    if (userId) {
      userSocketMap[userId] = socket.id;
    }

    // Broadcast the updated online users list
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};
