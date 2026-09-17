import { Report } from "../models/report.model.js";

export const createReport = async (req, res, next) => {
  try {
    const reporterId = req.user._id;
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const newReport = await Report.create({
      reporterId,
      targetType,
      targetId,
      reason,
      description
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. Our team will review it.",
      report: newReport
    });
  } catch (error) {
    next(error);
  }
};

// 2. ADMIN ONLY: Fetch all reports for the dashboard
export const getAllReports = async (req, res, next) => {
try {
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const { status } = req.query;

const skip = (page - 1) * limit;

const filter = {};
if (status) {
filter.status = status;
}

// 4. Run both queries at the same time to save time
const [reports, totalReports] = await Promise.all([
Report.find(filter)
.populate("reporterId", "firstName lastName email")
.sort({ createdAt: -1 })
.skip(skip)
.limit(limit),
Report.countDocuments(filter)
]);

return res.status(200).json({
success: true,
reports,
pagination: {
totalReports,
currentPage: page,
totalPages: Math.ceil(totalReports / limit),
hasNextPage: skip + reports.length < totalReports
}
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

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    return res.status(200).json({ success: true, report: updatedReport });
  } catch (error) {
    next(error);
  }
};
