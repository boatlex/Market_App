import Comment from "../models/comment.model.js";
import { Product } from "../models/product.model.js";
import { Notification } from "../models/notification.model.js"
import { getIO, getReceiverSocketIds } from "../socket/socket.js"; 


export const replyToComment = async (req, res, next) => {
    try {
        const { commentId } = req.params; 
        const { content } = req.body;
        const userId = req.user._id;

        if (!content || content.trim() === "") {
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
        
        await savedReply.populate("user", "firstName lastName profilePicture");

        // ====================================================================
        // 🔔 FIXED: CREATE TIMELINE NOTIFICATION LOG FOR REPLY
        // ====================================================================
        try {
            // Only alert if replying to someone else
            if (!parentComment.user.equals(userId)) {
                const replyNotification = await Notification.create({
                    recipientId: parentComment.user, // Author of main comment gets alerted
                    senderId: userId,               // Person replying
                    type: "reply",
                    productId: parentComment.product, // Links to main product container page
                    itemDetails: `replied to your comment: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`
                });

                const populatedNotification = await replyNotification.populate(
                    "senderId", 
                    "firstName lastName profilePicture"
                );

                const io = getIO();
                const targetSockets = getReceiverSocketIds(parentComment.user.toString());
                
                if (io && targetSockets.length > 0) {
                    targetSockets.forEach(socketId => {
                        io.to(socketId).emit('newNotification', populatedNotification);
                    });
                }
            }
        } catch (notifError) {
            console.error("Background reply timeline logging failed:", notifError);
        }
        // ====================================================================

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
        const itemDetailsString = `liked your comment: "${comment.content.substring(0, 40)}${comment.content.length > 40 ? '...' : ''}"`;

        if (isLiked) {
            comment.likes.pull(userId);
            
            try {
                await Notification.findOneAndDelete({
                    recipientId: comment.user,
                    senderId: userId,
                    itemDetails: itemDetailsString
                });
            } catch (delError) {
                console.error("Failed to clear unlike log:", delError);
            }

        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        // ====================================================================
        // 🔔 LIVE TRIGGER: NOTIFY AUTHOR REGARDING THE NEW LIKE
        // ====================================================================
        if (!isLiked && !comment.user.equals(userId)) {
            try {
                const likeNotification = await Notification.create({
                    recipientId: comment.user,   
                    senderId: userId,            
                    itemDetails: itemDetailsString
                });

                const populatedNotification = await likeNotification.populate(
                    "senderId", 
                    "firstName lastName profilePicture"
                );

                const io = getIO();
                const targetSockets = getReceiverSocketIds(comment.user.toString());
                
                if (io && targetSockets.length > 0) {
                    targetSockets.forEach(socketId => {
                        io.to(socketId).emit('newNotification', populatedNotification);
                    });
                }
            } catch (notifError) {
                console.error("Background like notification failed:", notifError);
            }
        }
        // ====================================================================

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
            .populate("user", "firstName lastName profilePicture")
            .sort({ createdAt: -1 }); 

        const mainComments = allComments.filter(c => c.parentId === null);
        const replies = allComments.filter(c => c.parentId !== null);

        const commentTree = mainComments.map(main => {
            return {
                ...main.toObject(),
                replies: replies.filter(r => r.parentId.toString() === main._id.toString())
                                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) 
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

        if (!content || content.trim() === "") {
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

        await savedComment.populate("user", "firstName lastName profilePicture");

        // ====================================================================
        // 🔔 FIXED: CREATE TIMELINE NOTIFICATION LOG FOR MAIN COMMENT
        // ====================================================================
        try {
            const commentNotification = await Notification.create({
                recipientId: product.seller, 
                senderId: userId,            
                type: "comment",            
                productId: productId,        
                itemDetails: `commented on your product "${product.name}": "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`
            });

            const populatedNotification = await commentNotification.populate(
                "senderId", 
                "firstName lastName profilePicture"
            );

            const io = getIO(); 
            const targetSockets = getReceiverSocketIds(product.seller.toString());

            if (io && targetSockets.length > 0) {
                targetSockets.forEach(socketId => {
                    io.to(socketId).emit('newNotification', populatedNotification);
                });
            }
        } catch (notifError) {
            console.error("Background comment timeline logging failed:", notifError);
        }
        // ====================================================================

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
