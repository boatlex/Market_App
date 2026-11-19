import { Feedback } from "../models/feedback.model.js";

export const submitFeedback = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { category, rating, subject, message } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please select a rating between 1 and 5 stars.",
      });
    }

    const feedback = await Feedback.create({
      user: userId,
      category: category || "General Feedback",
      rating: numericRating,
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been submitted.",
      feedback,
    });
  } catch (error) {
    next(error);
  }
};
