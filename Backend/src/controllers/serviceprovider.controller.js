import { ServiceProvider } from "../models/serviceprovider.model.js";
import cloudinary from "cloudinary";



export const upsertServiceProviderProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const {
            serviceId, 
            businessName,
            category,      
            serviceType,
            description,
            rate,
            basis,
            currency,
            phoneNumber,
            whatsappNumber,
            region,
            district,
            location,
            availabilityStatus
        } = req.body;

        const isRateRequiredButMissing = basis !== 'contact for quote' && !rate;
        if (!businessName || !category || !serviceType || !description || isRateRequiredButMissing || !basis || !region || !district || !location || !phoneNumber) {
            return res.status(400).json({ success: false, message: "Please fill in all mandatory provider fields." });
        }

        const updateData = {
            user: userId, 
            businessName,
            category: category.trim().toLowerCase(),         
            serviceType: serviceType.trim().toLowerCase(), 
            description,
            pricing: {
                rate: basis === 'contact for quote' ? 0 : (Number(rate) || 0),
                basis,
                currency: currency || "GHS"
            },
            phoneNumber,
            whatsappNumber: whatsappNumber || undefined,
            region,
            district,
            location,
            availabilityStatus: availabilityStatus || "Available"
        };

        const updatePayload = { $set: updateData };

        if (req.files && req.files.length > 0) {
            try {
                const uploadPromises = req.files.map(async (file) => {
                    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                    const uploadResponse = await cloudinary.v2.uploader.upload(base64File, {
                        folder: "service_providers_portfolio"
                    });
                    return uploadResponse.secure_url;
                });
                const uploadedUrls = await Promise.all(uploadPromises);
                updatePayload.$push = { portfolioImages: { $each: uploadedUrls } };
            } catch (uploadError) {
                return res.status(400).json({ success: false, message: "Failed to upload portfolio pictures." });
            }
        }

        // 🔑 2. CONDITION CHECK SWITCHER: 
        // If serviceId exists, query and update that specific document instance.
        // If serviceId is empty, generate a completely fresh listing copy instead of overwriting!
        const queryTarget = serviceId ? { _id: serviceId, user: userId } : { _id: new mongoose.Types.ObjectId() };

        const providerProfile = await ServiceProvider.findOneAndUpdate(
            queryTarget,
            updatePayload,
            { returnDocument: "after", upsert: true, runValidators: true }
        ).populate("user", "firstName lastName profilePicture email");

        return res.status(200).json({
            success: true,
            message: serviceId ? "Profile updated successfully!" : "New service posted successfully!",
            profile: providerProfile
        });

    } catch (error) {
        next(error);
    }
};


export const searchServiceProviders = async (req, res, next) => {
    try {
        const {
            keyword,
            region,
            district,
            category,     
            serviceType,  
            availabilityStatus,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

    
        if (keyword) {
            query.$text = { $search: String(keyword) };
        }

        if (category) {
            query.category = category.trim().toLowerCase();
        }

        if (serviceType) {
            query.serviceType = serviceType.trim().toLowerCase();
        }

        if (region) {
            query.region = { $regex: new RegExp(`^${region.trim()}$`, "i") };
        }

        if (district) {
            query.district = { $regex: new RegExp(`^${district.trim()}$`, "i") };
        }

        if (availabilityStatus) {
            query.availabilityStatus = availabilityStatus;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const providers = await ServiceProvider.find(query)
            .select(keyword ? { score: { $meta: "textScore" } } : {})
            .sort(keyword ? { score: { $meta: "textScore" } } : { createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate("user", "firstName lastName email profilePicture");

        const totalProviders = await ServiceProvider.countDocuments(query);

        return res.status(200).json({
            success: true,
            resultsCount: providers.length,
            totalPages: Math.ceil(totalProviders / Number(limit)),
            currentPage: Number(page),
            providers
        });

    } catch (error) {
        next(error);
    }
};

export const getMyProviderProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const services = await ServiceProvider.find({ user: userId })
            .populate("user", "firstName lastName profilePicture email")
            .sort({ createdAt: -1 }); 

        return res.status(200).json({
            success: true,
            data: services 
        });

    } catch (error) {
        next(error);
    }
};



export const getServiceProviderById = async (req, res, next) => {
    try {
        const { providerId } = req.params;

        const provider = await ServiceProvider.findById(providerId)
            .populate("user", "firstName lastName profilePicture email");

        if (!provider) {
            return res.status(404).json({ success: false, error: "Service provider profile not found." });
        }

        return res.status(200).json({ success: true, data: provider });
    } catch (error) {
        next(error);
    }
};


export const removePortfolioImage = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: "Image URL target parameter required." });
        }

        const updatedProfile = await ServiceProvider.findOneAndUpdate(
            { user: userId },
            { $pull: { portfolioImages: imageUrl } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Portfolio asset pulled successfully",
            portfolioImages: updatedProfile?.portfolioImages || []
        });
    } catch (error) {
        next(error);
    }
};



export const deleteServiceProviderProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const providerProfile = await ServiceProvider.findOne({ user: userId });
        
        if (!providerProfile) {
            return res.status(404).json({
                success: false,
                message: "No active service provider registry file found for this account entry."
            });
        }

        if (providerProfile.portfolioImages && providerProfile.portfolioImages.length > 0) {
            try {
                const deletePromises = providerProfile.portfolioImages.map((url) => {
                 
                    const urlSegments = url.split("/");
                    const uploadIndex = urlSegments.indexOf("upload");
                    const publicPathWithExtension = urlSegments.slice(uploadIndex + 2).join("/"); 
                    const publicId = publicPathWithExtension.split(".")[0];
                    
                    return cloudinary.v2.uploader.destroy(publicId);
                });
                
                await Promise.all(deletePromises);
            } catch (cloudinaryError) {
                console.error("Cloudinary batch storage cleanup dropped:", cloudinaryError);
                
            }
        }

        await ServiceProvider.findOneAndDelete({ user: userId });

        return res.status(200).json({
            success: true,
            message: "Your trade business profile has been permanently removed from our public provider directory tracking lists."
        });

    } catch (error) {
        next(error); 
    }
};

