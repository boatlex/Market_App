import { User } from "../models/user.model.js";
import filterObj from "../utils/filterObjects.js";

export const getMe = async (req, res, next) => {
    try {
        res.status(200).json({ 
            status: "success",  
            data: req.user 
        });
    } catch (error) {
        next(error)
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const filteredBody = filterObj(
            req.body,
            "firstName",
            "lastName",
            "profilePicture"  
        );

        const userDoc = await User.findByIdAndUpdate(
            req.user._id, 
            filteredBody,
            { new: true, runValidators: true }  
        );

        res.status(200).json({
            status: "success",
            data: userDoc,
            message: "User Updated successfully",
        });
    } catch (error) {
        next(error); 
    }
};
export const addToWishList = async (req, res,next) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $addToSet: { wishList: productId } },
            { new: true }
        ).populate('wishList')


        res.status(200).json({
            message: "Product Added to Wishlist Successfully",
            wishList: updatedUser.wishList
        });

    } catch (error) {
        console.error("Error in Adding Product to Wishlist:", error);
           next(error); 
    }

}

export const getWishList = async (req, res,next) => {
    try {
        const user = await User.findById(req.user._id)
            .select("wishList")
            .populate("wishList")
            .lean()

        res.status(200).json({ message: "Wishlist fetched successfully", wishList: user.wishList || [] })
    } catch (error) {
        console.error("Error in getting wishlist:", error)
           next(error); 
    }
}
export const removeFromWishList = async (req, res,next) => {
    try {
        const { productId } = req.params;
        const user = req.user;

        const hasProduct = user.wishList.some(id => id.toString() === productId);
        if (!hasProduct) {
            return res.status(404).json({ message: "Product not found in wishlist" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $pull: { wishList: productId } },
            { new: true }
        ).populate('wishList');

        res.status(200).json({
            message: "Product removed from wishlist successfully",
            wishList: updatedUser.wishList
        });

    } catch (error) {
        console.error("Error in removing wishlist:", error);
           next(error); 
    }

}
