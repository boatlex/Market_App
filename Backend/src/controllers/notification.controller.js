import { Notification } from "../models/notification.model.js";


export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "firstName lastName profilePicture") 
      .sort({ createdAt: -1 }); 

    return res.status(200).json({
      message: "Notifications fetched successfully.",
      notifications,
    });
  } catch (error) {
    console.error("Error in getMyNotifications:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "All notifications marked as read.",
      notifications,
    });
  } catch (error) {
    console.error("Error in markAllAsRead:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: notificationId } = req.params;

    
    const updatedNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true } },
      { returnDocument: "after" }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found or unauthorized." });
    }

    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Notification marked as read.",
      notifications,
    });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

