import Comment from "../models/comment.model.js"
import { Product } from "../models/product.model.js"


export const replyToComment = async (req, res, next) => {
    try {
        const { commentId } = req.params; 
        const { content } = req.body;
        const userId = req.user._id;

        if (!content) {
            return res.status(400).json({ message: "Reply content cannot be empty." });
        }

        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ message: "The comment you are trying to reply to does not exist." });
        }

        const reply = new Comment({
            user: userId,
            product: parentComment.product, 
            content,
            parentId: parentComment._id 
        });

        const savedReply = await reply.save();
        
        await savedReply.populate("user", "name profilePicture");

        return res.status(201).json({
            message: "Reply added successfully!",
            reply: savedReply
        });

    } catch (error) {
        next(error);
    }
};

export const toggleLikeComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }

        const isLiked = comment.likes.includes(userId);

        if (isLiked) {
            comment.likes.pull(userId);
        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        return res.status(200).json({
            message: isLiked ? "Comment unliked." : "Comment liked successfully!",
            likesCount: comment.likes.length,
            isLiked: !isLiked
        });

    } catch (error) {
        next(error);
    }
}

export const getProductComments = async (req, res, next) => {
    try {
        const { productId } = req.params;

        
        const allComments = await Comment.find({ product: productId })
            .populate("user", "name profilePicture")
            .sort({ createdAt: -1 }); 

        const mainComments = allComments.filter(c => c.parentId === null);
        const replies = allComments.filter(c => c.parentId !== null);

        // Group the replies inside their matching main comment objects for the frontend
        const commentTree = mainComments.map(main => {
            return {
                ...main._doc,
                // Find all replies belonging to this specific main comment ID
                replies: replies.filter(r => r.parentId.toString() === main._id.toString())
                                .sort((a, b) => a.createdAt - b.createdAt) // Oldest reply first
            };
        });

        return res.status(200).json({
            count: mainComments.length,
            comments: commentTree
        });

    } catch (error) {
        next(error);
    }
};

export const createComment = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { content } = req.body;
        const userId = req.user._id; 

        if (!content) {
            return res.status(400).json({ message: "Comment content cannot be empty." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

         if (product.seller.equals(userId)) {
            return res.status(403).json({ message: "Cannot comment on your own product." });
        }
        
        const newComment = new Comment({
            user: userId,
            product: productId,
            content
        });

        const savedComment = await newComment.save();

        product.comments.push(savedComment._id);
        await product.save();

        await savedComment.populate("user", "name profilePicture");

        return res.status(201).json({
            message: "Comment posted successfully!",
            comment: savedComment
        });

    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }

        if (!comment.user.equals(userId)) {
            return res.status(403).json({ message: "Not authorized to delete this comment." });
        }

        if (comment.parentId === null) {
            await Comment.deleteMany({ parentId: commentId });
            
            await Product.findByIdAndUpdate(comment.product, {
                $pull: { comments: commentId }
            });
        }

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            message: "Comment and all its nested replies removed successfully."
        });

    } catch (error) {
        next(error);
    }
};



