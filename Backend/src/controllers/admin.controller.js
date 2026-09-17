import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Report } from "../models/report.model.js";
import cloudinary from "../config/cloudinary.js";

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ verified: true })
            .select("-password")
            .sort({ createdAt: -1 });

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "No Users Found" });
        }

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Error Fetching Customers:", error);
        next(error);
    }
};

export const adminDeleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        if (product.images && product.images.length > 0) {
            const deletePromises = product.images.map((imageUrl) => {
                const parts = imageUrl.split("/upload/");
                if (parts.length > 1) {
                    const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
                    const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf("."));
                    return cloudinary.uploader.destroy(publicId);
                }
            });
            await Promise.all(deletePromises.filter(Boolean));
        }


        await Product.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Administrative Action: Product removed successfully."
        });

    } catch (error) {
        console.error("Admin Delete Error:", error);
        next(error);
    }
};

export const getAllProducts = async (req, res, next) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .lean();

        if (!products || products.length === 0) {
            return res.status(200).json({
                success: true,
                products: [],
                message: "No product listings have been created yet."
            });
        }

        return res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        console.error("Error Fetching Products:", error);
        next(error);
    }
};

export const getDashboardStats = async (req, res, next) => {
    try {
        
        const [totalUsers, totalProducts, statusCounts] = await Promise.all([
            User.countDocuments({ role: "user" }),
            Product.countDocuments(),
            Report.aggregate([
                {
                    $group: {
                        _id: "$status", 
                        count: { $sum: 1 } // Add 1 for every matching document
                    }
                }
            ])
        ]);

        
        const reportStats = {
            pending: 0,
            under_review: 0,
            resolved: 0,
            dismissed: 0
        };

        // 3. Map the database results into our default object
        statusCounts.forEach(item => {
            if (item._id in reportStats) {
                reportStats[item._id] = item.count;
            }
        });

        
        const totalReports = reportStats.pending + reportStats.under_review + reportStats.resolved + reportStats.dismissed;

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalProducts,
                totalReports, 
                reportBreakdown: reportStats 
            }
        });

    } catch (error) {
        console.error("Error Fetching DashBoard Stats:", error);
        next(error);
    }

};






