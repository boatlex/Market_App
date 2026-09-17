import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 280,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    // ADDED: This points back to the main comment if this text is a reply!
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null, // Main comments will have this set to null
        index: true    // Speeds up fetching replies for a specific comment
    }
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
