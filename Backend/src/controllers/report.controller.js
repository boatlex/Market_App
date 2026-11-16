import mongoose from "mongoose";
import { Report } from "../models/report.model.js";


export const createReport = async (req, res, next) => {
  try {
    const reporterId = req.user._id;
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: "Invalid target ID." });
    }


    if (targetType === "User" && targetId.toString() === reporterId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot report your own account." });
    }


    const existingReport = await Report.findOne({
      reporterId,
      targetType,
      targetId,
      status: "pending",
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending report for this item.",
      });
    }

    const newReport = await Report.create({
      reporterId,
      targetType,
      targetId,
      reason,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. Our team will review it.",
      report: newReport,
    });
  } catch (error) {
    next(error);
  }
};

// 4. USER: Fetch current user's submitted reports
export const getMyReports = async (req, res, next) => {
  try {
    const reporterId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const { status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { reporterId };
    if (status) {
      filter.status = status;
    }

    const [reports, totalReports] = await Promise.all([
      Report.find(filter)
        .populate({
          path: "targetId",
          select: "-password -otp -otp_expiry_time -resetPasswordToken -resetPasswordExpires",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalReports / limit);

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        totalReports,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. ADMIN ONLY: Fetch all reports for the dashboard
export const getAllReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const { status, targetType } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    // Scope to the user's own reports if they are not an admin
    if (req.user.role !== "admin") {
      filter.reporterId = req.user._id;
    }

    if (status) {
      filter.status = status;
    }
    if (targetType) {
      filter.targetType = targetType;
    }

    const [reports, totalReports] = await Promise.all([
      Report.find(filter)
        .populate("reporterId", "firstName lastName email profilePicture")
        .populate({
          path: "targetId",
          select: "-password -otp -otp_expiry_time -resetPasswordToken -resetPasswordExpires",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalReports / limit);

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        totalReports,
        totalItems: totalReports,
        currentPage: page,
        totalPages,
        limit,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};


// 3. ADMIN ONLY: Change status (e.g., mark as "resolved")
export const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate("reporterId", "firstName lastName email profilePicture")
      .populate({
        path: "targetId",
        select: "-password -otp -otp_expiry_time -resetPasswordToken -resetPasswordExpires",
      });

    if (!updatedReport) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      report: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};
