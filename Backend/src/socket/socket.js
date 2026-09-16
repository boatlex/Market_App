import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { Notification } from "../models/notification.model.js"

const userSocketMap = {}; 

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true }
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
    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // --- Typing Events ---
    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("displayTyping", { senderId: userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("hideTyping", { senderId: userId });
    });

    // --- NEW: Call Me Back Event ---
    socket.on("requestCallMeBack", async ({ sellerId, itemDetails }) => {
      try {
        // 1. Always save the notification to MongoDB first
        const newNotification = await Notification.create({
          recipientId: sellerId,
          senderId: userId,
          type: "call_me_back",
          itemDetails: itemDetails
        });

        // 2. Look up if the seller is currently online
        const sellerSocketId = getReceiverSocketId(sellerId);
        
        if (sellerSocketId) {
          // 3. Send the notification data in real-time
          io.to(sellerSocketId).emit("receiveCallMeBackNotification", newNotification);
        }
      } catch (error) {
        console.error("Error saving notification:", error);
      }
    });

    // New Buyer offer notification event:
socket.on("sendOffer", async ({ sellerId, itemDetails, offerPrice }) => {
  try {
    const newNotification = await Notification.create({
      recipientId: sellerId,
      senderId: userId,
      type: "make_an_offer",
      itemDetails: `${itemDetails} for $${offerPrice}` // Storing item and price context
    });

    const sellerSocketId = getReceiverSocketId(sellerId);
    if (sellerSocketId) {
      io.to(sellerSocketId).emit("receiveOfferNotification", newNotification);
    }
  } catch (error) {
    console.error("Error saving offer notification:", error);
  }
});


    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};
