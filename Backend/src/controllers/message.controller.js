import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketIds } from "../socket/socket.js";
import cloudinary from "cloudinary";
import { encryptText, decryptText } from "../utils/encription.js";

const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  try {
    // Splits URL to isolate the folder and filename without extension
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const publicIdWithExtension = parts[1].replace(/^v\d+\//, ''); // Removes version tag like v1234567
    return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
  } catch (error) {
    console.error("Failed to parse Cloudinary Public ID:", error);
    return null;
  }
};
const emitMessagesRead = (req, senderId, readerId) => {
  const io = req.app.get("io");
  if (!io) return;

  const senderSocketIds = getReceiverSocketIds(senderId);
  senderSocketIds.forEach((socketId) => {
    io.to(socketId).emit("messagesRead", {
      readerId: String(readerId),
    });
  });
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content, messageType, voiceDuration, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const activeType = messageType || "text";

    let uploadedAttachmentUrl = null;
    if (req.file) {
      try {
        const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        let uploadOptions = {
          folder: "marketplace_chat_attachments"
        };

        if (activeType === "voice") {
          uploadOptions.resource_type = "video";
        } else if (activeType === "image") {
          uploadOptions.resource_type = "image";
        }

        const uploadResponse = await cloudinary.v2.uploader.upload(base64File, uploadOptions);
        uploadedAttachmentUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Chat Upload Error:", uploadError.message);
        return res.status(500).json({ success: false, message: "Failed to process media file storage uploads." });
      }
    }

    if (activeType === "text" && !content?.trim()) {
      return res.status(400).json({ success: false, message: "Text content parameter field cannot be empty." });
    }

    if ((activeType === "image" || activeType === "voice") && !uploadedAttachmentUrl) {
      return res.status(400).json({ success: false, message: `Missing required file parameter for: ${activeType}` });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        createdBy: senderId
      });
    }

    const updateResult = await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId: receiverId,
        read: false,
      },
      { $set: { read: true } }
    );

    if (updateResult.modifiedCount > 0) {
      emitMessagesRead(req, receiverId, senderId);
    }

    // 1. Encrypt text content before saving to MongoDB
    const rawContent = activeType === "text" ? content : (content || undefined);
    const encryptedContent = rawContent ? encryptText(rawContent) : undefined;

    const newMessage = new Message({
      conversationId: conversation._id,
      senderId,
      content: encryptedContent, 
      attachment: uploadedAttachmentUrl,
      messageType: activeType,
      voiceDuration: activeType === "voice" ? (Number(voiceDuration) || 0) : 0,
      replyTo: replyTo || null
    });

    conversation.lastMessage = newMessage._id;

    await Promise.all([conversation.save(), newMessage.save()]);

    if (newMessage.replyTo) {
      await newMessage.populate({
        path: "replyTo",
        select: "content messageType attachment senderId",
        populate: { path: "senderId", select: "firstName lastName" }
      });
    }

    // 2. Convert to plain object and decrypt for Socket.io & HTTP response
    const messagePayload = newMessage.toObject();
    if (messagePayload.content) {
      messagePayload.content = decryptText(messagePayload.content);
    }
    if (messagePayload.replyTo?.content) {
      messagePayload.replyTo.content = decryptText(messagePayload.replyTo.content);
    }

    // --- SOCKET.IO REAL-TIME LOGIC ---
    const io = req.app.get("io");
    if (io) {
      const receiverSocketIds = getReceiverSocketIds(receiverId);

      if (receiverSocketIds && receiverSocketIds.length > 0) {
        receiverSocketIds.forEach(socketId => {
          io.to(socketId).emit("newMessage", messagePayload);
        });
      }
    }
    // ---------------------------------

    return res.status(201).json({ success: true, message: messagePayload });

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
    })
      .populate({
        path: "replyTo",
        select: "content messageType attachment senderId",
        populate: { path: "senderId", select: "firstName lastName" }
      })
      .sort({ createdAt: 1 });

    const decryptedMessages = messages.map((msg) => {
      const obj = msg.toObject();
      if (obj.content) {
        obj.content = decryptText(obj.content);
      }
      if (obj.replyTo?.content) {
        obj.replyTo.content = decryptText(obj.replyTo.content);
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      messages: decryptedMessages
    });

  } catch (error) {
    console.error("Error in getMessages controller:", error.message);
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate({
        path: "participants",
        select: "firstName lastName profilePicture",
      })
      .populate({
        path: "lastMessage",
        select: "content attachment messageType senderId createdAt",
      })
      .sort({ updatedAt: -1 });

    // Count unread incoming messages per conversation in parallel
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser = conversation.participants.find(
          (participant) => participant._id.toString() !== currentUserId.toString()
        );

        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: currentUserId },
          read: false,
        });

        let previewText = "No messages yet";
        if (conversation.lastMessage) {
          // Decrypt lastMessage content first so meme checks and text previews work properly
          const decryptedContent = conversation.lastMessage.content
            ? decryptText(conversation.lastMessage.content)
            : "";

          if (conversation.lastMessage.messageType === "image") {
            previewText = "📷 Photo message";
          } else if (conversation.lastMessage.messageType === "voice") {
            previewText = "🎙️ Voice note";
          } else if (decryptedContent.startsWith("[MEME]|")) {
            previewText = "😄 Meme";
          } else {
            previewText = decryptedContent;
          }
        }

        return {
          _id: conversation._id,
          user: {
            _id: otherUser?._id,
            firstName: otherUser?.firstName || "Unknown User",
            lastName: otherUser?.lastName || "Unknown User",
            profilePicture: otherUser?.profilePicture || null,
          },
          lastMessage: conversation.lastMessage
            ? {
                content: previewText,
                createdAt: conversation.lastMessage.createdAt,
                senderId: conversation.lastMessage.senderId,
              }
            : null,
          unreadCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error("Error in getConversations controller:", error.message);
    next(error);
  }
};


export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (String(message.senderId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "You can only delete your own messages." });
    }

    // 1. Remove attached image or voice note from Cloudinary
    if (message.attachment) {
      const publicId = getCloudinaryPublicId(message.attachment);
      if (publicId) {
        try {
          const resourceType = message.messageType === "voice" ? "video" : "image";
          await cloudinary.v2.uploader.destroy(publicId, {
            resource_type: resourceType,
          });
        } catch (cloudErr) {
          console.error("Cloudinary chat asset deletion error:", cloudErr.message);
        }
      }
    }

    // 2. Delete message from MongoDB and update conversation.lastMessage if needed
    const conversation = await Conversation.findById(message.conversationId);
    await Message.findByIdAndDelete(messageId);

    if (conversation && String(conversation.lastMessage) === String(messageId)) {
      const previousMsg = await Message.findOne({
        conversationId: conversation._id,
      }).sort({ createdAt: -1 });

      conversation.lastMessage = previousMsg ? previousMsg._id : null;
      await conversation.save();
    }

    // 3. Notify the other participant in real time
    const io = req.app.get("io");
    if (io && conversation) {
      const receiverId = conversation.participants.find(
        (p) => String(p) !== String(userId)
      );
      if (receiverId) {
        const receiverSocketIds = getReceiverSocketIds(receiverId);
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("messageDeleted", {
            messageId: String(messageId),
            senderId: String(userId),
          });
        });
      }
    }

    return res.status(200).json({ success: true, messageId });
  } catch (error) {
    console.error("Error in deleteMessage controller:", error.message);
    next(error);
  }
};
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { id: senderId } = req.params;
    const readerId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [readerId, senderId], $size: 2 },
    });

    if (!conversation) {
      return res.status(200).json({ success: true });
    }

    const result = await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId,
        read: false,
      },
      { $set: { read: true } }
    );

    if (result.modifiedCount > 0) {
      emitMessagesRead(req, senderId, readerId);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    next(error);
  }
};
