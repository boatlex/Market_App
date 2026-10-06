
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { Notification } from "../models/notification.model.js"

// 🚀 REFACTOR: Store a Set of multiple active sockets per User ID
// Example structural form: { "user_123": Set(["socket_abc", "socket_xyz"]) }
const userSocketMap = {}; 

export const getReceiverSocketIds = (receiverId) => {
  // Returns an array of active sockets or an empty array if offline
  return userSocketMap[receiverId] ? Array.from(userSocketMap[receiverId]) : [];
};

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    transports: ['websocket'] // 🚀 CRITICAL: Forces connection handshake stability matching your mobile React Native code
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.userId = decoded.userId; 
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    
    if (userId) {
      // Initialize the tracking Set if this is the user's first connection window
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
      }
      userSocketMap[userId].add(socket.id);
    }

    // Broadcast list of distinct online user keys to everyone
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // --- Typing Events ---
    socket.on("typing", ({ receiverId }) => {
      const targetSockets = getReceiverSocketIds(receiverId);
      targetSockets.forEach(socketId => {
        io.to(socketId).emit("displayTyping", { senderId: userId });
      });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const targetSockets = getReceiverSocketIds(receiverId);
      targetSockets.forEach(socketId => {
        io.to(socketId).emit("hideTyping", { senderId: userId });
      });
    });

    // --- Call Me Back Event ---
    socket.on("requestCallMeBack", async ({ sellerId, itemDetails }) => {
      try {
        const newNotification = await Notification.create({
          recipientId: sellerId,
          senderId: userId,
          type: "call_me_back",
          itemDetails: itemDetails
        });

        // 🚀 Loop across all active devices the seller has open
        const targetSockets = getReceiverSocketIds(sellerId);
        targetSockets.forEach(socketId => {
          io.to(socketId).emit("receiveCallMeBackNotification", newNotification);
        });
      } catch (error) {
        console.error("Error saving notification:", error);
      }
    });

    // --- Buyer Offer Notification Event ---
    socket.on("sendOffer", async ({ sellerId, itemDetails, offerPrice }) => {
      try {
        const newNotification = await Notification.create({
          recipientId: sellerId,
          senderId: userId,
          type: "make_an_offer",
          itemDetails: `${itemDetails} for $${offerPrice}`
        });

        // 🚀 Loop across all active devices the seller has open
        const targetSockets = getReceiverSocketIds(sellerId);
        targetSockets.forEach(socketId => {
          io.to(socketId).emit("receiveOfferNotification", newNotification);
        });
      } catch (error) {
        console.error("Error saving offer notification:", error);
      }
    });

    // --- Fixed Safe Disconnect Logic ---
    socket.on("disconnect", () => {
      if (userId && userSocketMap[userId]) {
        // Remove only the single socket that disconnected
        userSocketMap[userId].delete(socket.id);
        
        if (userSocketMap[userId].size === 0) {
          delete userSocketMap[userId];
        }
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
}