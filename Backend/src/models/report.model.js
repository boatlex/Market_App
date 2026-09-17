import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    
    targetType: { 
      type: String, 
      enum: ["product", "user", "comment"], 
      required: true 
    },
    targetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      refPath: "targetType" // Mongoose trick: dynamically links to the right collection!
    },
    reason: { 
      type: String, 
      enum: ["scam", "inappropriate_content", "fake_item", "harassment", "other"], 
      required: true 
    },
    description: { 
      type: String, 
      trim: true,
      maxLength: 500 
    },
    status: { 
      type: String, 
      enum: ["pending", "under_review", "resolved", "dismissed"], 
      default: "pending",
      index: true
    },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
