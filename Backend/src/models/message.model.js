import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  content: {
    type: String,
    trim: true
  },
  
  attachment: {
    type: String,
    trim: true
  },
  
  messageType: {
    type: String,
    enum: ["text", "image", "voice"],
    default: "text",
    required: true
  },
  
  voiceDuration: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
