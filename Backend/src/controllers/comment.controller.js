import Comment from "../models/comment.model"
import { Product } from "../models/product.model"
import { getAuth } from "@clerk/express"
import { User } from "../models/user.model";


export const getProductComments = async (req, res, next) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required." });
        }
        const comments = await Comment.find({ product: productId })
            .sort({ createdAt: -1 })
            .populate("user", "firstName lastName profilePicture");

        return res.status(200).json({ comments });

    } catch (error) {

        next(error)
    }
}

export const createComment = async (req, res,next) => {
  try {
    const clerkAuth = typeof getAuth === 'function' ? getAuth(req) : {};
    const clerkUserId = clerkAuth?.userId; 
    const m_userId = req.user?._id;

    const { productId } = req.params;
    const { content } = req.body;

    
    if (!content) {
        return res.status(400).json({ error: "Comment content is required" });
    }

    let databaseUser;
    if (m_userId) {
        databaseUser = await User.findById(m_userId);
    } else if (clerkUserId) {
        databaseUser = await User.findOne({ clerkId: clerkUserId });
    }

    const product = await Product.findById(productId);

    if (!databaseUser || !product) {
        return res.status(404).json({ error: "User or Product Not Found" });
    }

    if (product.seller.equals(databaseUser._id)) {
        return res.status(403).json({ 
            error: "Forbidden: You cannot comment on your own product." 
        });
    }

    const comment = await Comment.create({
        user: databaseUser._id, 
        product: productId,
        content
    });

    await Product.findByIdAndUpdate(productId, {
        $push: { comments: comment._id } 
    });

    return res.status(201).json({ comment });
  } catch (error) {
    next(error)
  }
}


export const deleteComment = async (req, res, next) => { 
    try {
        
        const clerkAuth = typeof getAuth === 'function' ? getAuth(req) : {};
        const clerkUserId = clerkAuth?.userId; 
        const m_userId = req.user?._id;

        const { commentId } = req.params;

        
        let databaseUser;
        if (m_userId) {
            databaseUser = await User.findById(m_userId);
        } else if (clerkUserId) {
            databaseUser = await User.findOne({ clerkId: clerkUserId });
        }

        
        const comment = await Comment.findById(commentId);

        if (!databaseUser || !comment) {
            return res.status(404).json({ error: "User or Comment Not Found" });
        }

      
        if (!comment.user.equals(databaseUser._id)) {
            return res.status(403).json({ error: "You can only delete your own comment" })     }

    
        await Product.findByIdAndUpdate(comment.product, {
            $pull: { comments: commentId }
        });
        

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            message: "Comment Deleted Successfully"
        });

    } catch (error) {
        next(error);  
    }
};

