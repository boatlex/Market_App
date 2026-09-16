import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId } from "../socket/socket.js"; 

export const sendMessage = async (req, res, next) => {
  try {
    const { content, attachment } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        createdBy: senderId
      });
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      senderId,
      content,
      attachment
    });

    conversation.lastMessage = newMessage._id;
    
    await Promise.all([conversation.save(), newMessage.save()]);

    // --- SOCKET.IO REAL-TIME LOGIC ---
    const io = req.app.get("io");
    if (io) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }
    // ---------------------------------

    return res.status(201).json({ success: true, message: newMessage });

  } catch (error) {
    console.error("Error in sendMessage controller:", error.message);
    next(error); 
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id; 

    
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId], $size: 2 }
    }); 

    if (!conversation) {
      return res.status(200).json({ success: true, messages: [] });
    }
 
    const messages = await Message.find({
      conversationId: conversation._id
    }).sort({ createdAt: 1 }); 

    return res.status(200).json({ 
      success: true, 
      messages: messages 
    });

  } catch (error) {
    console.error("Error in getMessages controller:", error.message);
    next(error); 
  }
};


