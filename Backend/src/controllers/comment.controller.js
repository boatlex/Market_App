import Comment from "../models/comment.model.js"
import { Product } from "../models/product.model.js"


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

export const createComment = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { content } = req.body;

    const databaseUser = req.user;

    if (!databaseUser) {
      return res.status(401).json({ success: false, error: "Unauthorized: User session missing." });
    }
    
    if (!content) {
        return res.status(400).json({ success: false, error: "Comment content is required" });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({ success: false, error: "Product Not Found" });
    }

    if (product.seller.equals(databaseUser._id)) {
        return res.status(403).json({ 
            success: false,
            error: "Forbidden: You cannot comment on your own product." 
        });
    }

    const comment = await Comment.create({
        user: databaseUser._id, 
        product: productId,
        content
    });

    // 5. Update the product's comment reference array list link
    await Product.findByIdAndUpdate(productId, {
        $push: { comments: comment._id } 
    });

    // Standardized consistent response layout formatting structure
    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error("Error Creating Comment:", error);
    next(error);
  }
};


export const deleteComment = async (req, res, next) => { 
    try {
        const { commentId } = req.params;

        const databaseUser = req.user;

        if (!databaseUser) {
            return res.status(401).json({ success: false, error: "Unauthorized: User session missing." });
        }
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, error: "Comment Not Found" });
        }

        if (!comment.user.equals(databaseUser._id)) {
            return res.status(403).json({ success: false, error: "You can only delete your own comment" });
        }

        
        await Product.findByIdAndUpdate(comment.product, {
            $pull: { comments: commentId }
        });
        
        
        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully"
        });

    } catch (error) {
        console.error("Error Deleting Comment:", error);
        next(error);  
    }
};


