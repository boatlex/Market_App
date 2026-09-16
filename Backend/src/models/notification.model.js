import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // Makes searching fast
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["call_me_back", "make_an_offer"], 
      default: "call_me_back" 
    },
    itemDetails: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true } 
);

export const Notification = mongoose.model("Notification", notificationSchema);
