import { User } from "../models/user.model.js"
import filterObj from "../utils/filterObjects.js"

export const getMe = async (req, res) => {
    try {
        res.status(200).json({ status: success, data: req.user })
    } catch (error) {
        next(error)
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const filteredBody = filterObj(
            req.body,
            "firstName",
            "lastName",
            "imageUrl"
        );

        const userDoc = await User.findByIdAndUpdate(req.user._id, filteredBody);

        res.status(200).json({
            status: "success",
            data: userDoc,
            message: "User Updated successfully",
        });
    } catch (error) {
        next(error)
    }
}