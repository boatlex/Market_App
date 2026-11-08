import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { Notification } from "../models/notification.model.js";

const userSocketMap = {}; 
let io = null; 

export const getReceiverSocketIds = (receiverId) => {
  return userSocketMap[receiverId] ? Array.from(userSocketMap[receiverId]) : [];
};


export const getIO = () => {
  return io;
};

export const initializeSocket = (httpServer) => {
  // Assign the instance to our file-scoped variable here
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    transports: ['websocket'] 
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
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
      }
      userSocketMap[userId].add(socket.id);
    }

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
      // --- Call Me Back Event ---
    socket.on("requestCallMeBack", async ({ sellerId, productId, itemDetails }) => { 
      try {
        const newNotification = await Notification.create({
          recipientId: sellerId,
          senderId: userId,
          type: "call_me_back",
          productId: productId,
          itemDetails: itemDetails
        });

        // Populate user data before broadcasting
        const populatedNotification = await newNotification.populate(
          "senderId",
          "firstName lastName profilePicture"
        );

      
        const targetSockets = getReceiverSocketIds(sellerId);
        targetSockets.forEach(socketId => {
          io.to(socketId).emit("newNotification", populatedNotification);
        });
      } catch (error) {
        console.error("Error saving notification:", error);
      }
    });

    // --- Buyer Offer Notification Event ---
    socket.on("sendOffer", async ({ sellerId, productId, itemDetails, offerPrice }) => { // 💡 Added productId parameter
      try {
        const newNotification = await Notification.create({
          recipientId: sellerId,
          senderId: userId,
          type: "make_an_offer",
          productId: productId, 
          itemDetails: `${itemDetails} for $${offerPrice}`
        });

        // Populate user data before broadcasting
        const populatedNotification = await newNotification.populate(
          "senderId",
          "firstName lastName profilePicture"
        );

        const targetSockets = getReceiverSocketIds(sellerId);
        targetSockets.forEach(socketId => {
          io.to(socketId).emit("newNotification", populatedNotification);
        });
      } catch (error) {
        console.error("Error saving offer notification:", error);
      }
    });

    socket.on("disconnect", () => {
      if (userId && userSocketMap[userId]) {
        userSocketMap[userId].delete(socket.id);
        if (userSocketMap[userId].size === 0) {
          delete userSocketMap[userId];
        }
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};
