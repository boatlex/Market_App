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
  
}, { timestamps: true })

const Comment = mongoose.model("Comment", commentSchema)

export default Comment