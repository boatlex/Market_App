import { Notification } from "../models/notification.model.js";

export const getMyNotifications = async (req, res,next) => {
  try {
    const userId = req.user._id; 

    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "firstName lastName profilePicture") 
      .sort({ createdAt: -1 }); 

    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    next(error)
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { isRead: true },
      { new: true }
    ).populate("senderId", "firstName lastName profilePicture")

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    next(error)
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const updateResult = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ 
      success: true, 
      count: updateResult.modifiedCount, 
      message: "All notifications marked as read." 
    });
  } catch (error) {
    console.error("Mark All As Read Error:", error)
    next(error)
  }
};

