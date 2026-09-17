import { ServiceProvider } from "../models/serviceprovider.model.js";
import cloudinary from "cloudinary";

export const upsertServiceProviderProfile = async (req, res, next) => {
    try {
        const userId = req.user._id; 
        
        const {
            businessName,
            serviceType,
            description,
            pricingRate,
            pricingBasis,
            pricingCurrency,
            phoneNumber,
            whatsappNumber,
            region,
            district,
            availabilityStatus
        } = req.body;

        const imageFiles = req.files; 

        
        if (!businessName || !serviceType || !description || !pricingRate || !pricingBasis || !phoneNumber || !region || !district) {
            return res.status(400).json({ message: "Please fill in all required fields." });
        }

        
        let uploadedPortfolioUrls = [];
        if (imageFiles && imageFiles.length > 0) {
            try {
                const uploadPromises = imageFiles.map((file) => {
                    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                    return cloudinary.uploader.upload(base64Image, {
                        folder: "service_portfolios",
                        resource_type: "image",
                        transformation: [
                            { width: 800, height: 800, crop: "limit" },  
                            { quality: "auto" }
                        ]
                    });
                });

                const uploadResults = await Promise.all(uploadPromises);
                uploadedPortfolioUrls = uploadResults.map(result => result.secure_url);
            } catch (uploadError) {
                console.error("Cloudinary portfolio upload error:", uploadError);
                return res.status(400).json({ error: "Failed to upload portfolio images." });
            }
        }

        // 3. Construct the Profile Data Object
        const updateData = {
            user: userId,
            businessName,
            serviceType,
            description,
            pricing: {
                rate: Number(pricingRate),
                basis: pricingBasis,
                currency: pricingCurrency || "GHS"
            },
            phoneNumber,
            whatsappNumber: whatsappNumber || phoneNumber, 
            region,
            district,
            availabilityStatus: availabilityStatus || "Available"
        };

        if (uploadedPortfolioUrls.length > 0) {
            updateData.portfolioImages = uploadedPortfolioUrls;
        }

        
        const serviceProfile = await ServiceProvider.findOneAndUpdate(
            { user: userId },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        ).populate("user", "name email");

        return res.status(200).json({
            message: "Service provider profile configured successfully!",
            profile: serviceProfile
        });

    } catch (error) {
        next(error);
    }
};


export const getMyServiceProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const profile = await ServiceProvider.findOne({ user: userId })
            .populate("user", "name email,");

        if (!profile) {
            return res.status(404).json({ message: "Service profile details not found. Please set one up." });
        }

        return res.status(200).json({ profile });
    } catch (error) {
        next(error);
    }
};
