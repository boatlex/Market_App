import { Product } from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js"
import { promises as fsPromises } from 'fs';

import { Product } from "../models/Product.js"; // Adjust path as necessary
import fsPromises from "fs/promises";
import cloudinary from "../config/cloudinary.js"; // Adjust path as necessary

export const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            phoneNumber,
            category,
            productType,
            region,
            district, 
            delivery,  
            warranty,  
            brand,     
            color,     
            condition  
        } = req.body;

        const sellerId = req.user?._id;

        if (!sellerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing user session." });
        }

        
        if (!name || !description || !price || !phoneNumber || !category || !productType || !region || !district) {
            if (req.files) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
            }
            return res.status(400).json({ success: false, message: "All required text fields must be provided." });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image file is required" });
        }

        
        const uploadPromises = req.files.map(async (file) => {
            const normalizedPath = file.path.replace(/\\/g, '/');
            return await cloudinary.uploader.upload(normalizedPath, {
                folder: "products",
                upload_preset: "images" 
            });
        });

        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map((result) => result.secure_url);

         
        for (const file of req.files) {
            await fsPromises.unlink(file.path).catch((err) =>
                console.error("Failed to delete local temp file:", err.message)
            );
        }

        // Parse delivery times if provided as a JSON string or object
        let parsedDelivery;
        if (delivery) {
            parsedDelivery = typeof delivery === 'string' ? JSON.parse(delivery) : delivery;
        }

        
        const product = await Product.create({
            seller: sellerId, 
            name,
            description,
            price: parseFloat(price),
            phoneNumber: phoneNumber.trim(),
            productType,
            region,
            district, 
            category,
            images: imageUrls,
            // Safely pass through optional metadata fields
            delivery: parsedDelivery,
            warranty,
            brand,
            color,
            condition
        });

        return res.status(201).json({ success: true, product });

    } catch (error) {
        console.error("Error Creating Product:", error);

        // Emergency cleanup if Cloudinary upload succeeded but DB creation failed
        if (req.files) {
            for (const file of req.files) {
                await fsPromises.unlink(file.path).catch(() => { });
            }
        }

        next(error);
    }
};


export const getFilteredProducts = async (req, res, next) => {
    try {
        const { search, region, category, condition, priceMin, priceMax } = req.query;

        let query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (region) {
            query.region = region;
        }

        if (category) {
            query.category = category;
        }

        if (condition) {
            query.condition = condition;
        }

        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = Number(priceMin); // Greater than or equal to
            if (priceMax) query.price.$lte = Number(priceMax); // Less than or equal to
        }


        const products = await Product.find(query).sort({ createdAt: -1 });


        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        next(error)
    }
}


export const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Base marketplace filter constraint to only pull active items
        const filter = { isAvailable: true };

        // 1. Text Search Filter (Handles names or descriptions)
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { description: { $regex: req.query.search, $options: "i" } }
            ];
        }

        // 2. Marketplace Classification Selectors (Leverages indexed keys)
        if (req.query.category) filter.category = String(req.query.category).toLowerCase();
        if (req.query.productType) filter.productType = String(req.query.productType).toLowerCase();
        if (req.query.region) filter.region = String(req.query.region);
        if (req.query.district) filter.district = String(req.query.district);
        if (req.query.condition) filter.condition = String(req.query.condition);

        // 3. Price-Range Comparison Sliders
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
        }

        // 4. Run database requests concurrently to maximize throughput performance
        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("seller", "firstName lastName profilePicture")
                .populate({
                    path: "comments",
                    populate: {
                        path: "user",
                        select: "firstName lastName profilePicture"
                    }
                }),
            Product.countDocuments(filter)
        ]);

        return res.status(200).json({ 
            success: true, 
            products,
            pagination: {
                totalProducts,
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                hasNextPage: skip + products.length < totalProducts
            }
        });

    } catch (error) {
        next(error);
    }
};


export const getProduct = async (req, res, next) => {
    try {
        const { productId } = req.params

        const userProduct = await Product.findById(productId)
            .sort({ createdAt: -1 })
            .populate("seller", "firstName lastName profilePicture")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "firstName lastName profilePicture"
                }
            })

        if (!userProduct) return res.status(404).json({ error: "Product Not Found" })

        res.status(200).json({ userProduct })
    } catch (error) {
        next(error)
    }
}


export const getUserProducts = async (req, res, next) => {
    try {

        const databaseUser = req.user;

        if (!databaseUser) {
            return res.status(404).json({ success: false, error: "User Not Found" });
        }

        // 2. Query products using the cleanly available database User ID
        const products = await Product.find({ seller: databaseUser._id })
            .sort({ createdAt: -1 })
            .populate("seller", "firstName lastName profilePicture")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "firstName lastName profilePicture"
                }
            });

        return res.status(200).json({ success: true, products });

    } catch (error) {
        console.error("Error Fetching User Products:", error);
        next(error);
    }
};


export const updateProduct = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            phoneNumber,
            category,
            productType,
            region,
            district,     
            location,     
            warranty,     
            brand,        
            color,        
            delivery,     
            condition,    
            existingImages 
        } = req.body;

        const { id } = req.params;
        const databaseUser = req.user; 

        if (!databaseUser) {
            if (req.files) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
            }
            return res.status(401).json({ success: false, message: "Unauthorized: Session missing." });
        }

        const product = await Product.findById(id);
        if (!product) {
            if (req.files) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
            }
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        const isOwner = product.seller.equals(databaseUser._id);
        const isAdmin = databaseUser.role === "admin";

        if (!isOwner && !isAdmin) {
            if (req.files) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
            }
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: You do not have permission to modify this product." 
            });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (price !== undefined) product.price = parseFloat(price);
        if (phoneNumber !== undefined) product.phoneNumber = phoneNumber.trim();
        if (category) product.category = category;
        if (productType) product.productType = productType;
        if (region) product.region = region;
        if (district) product.district = district;  
        if (location) product.location = location;
        if (condition) product.condition = condition;

        
        if (warranty !== undefined) product.warranty = warranty;
        if (brand !== undefined) product.brand = brand;
        if (color !== undefined) product.color = color;

        
        if (delivery !== undefined) {
            product.delivery = typeof delivery === 'string' ? JSON.parse(delivery) : delivery;
        }

        // Handle Image Deletions & Merges
        let finalImages = [];
        if (existingImages !== undefined) {
            // Handle edge case where a single string instead of an array is posted by FormData
            const parsedExisting = Array.isArray(existingImages) ? existingImages : [existingImages].filter(Boolean);
            
            // Fixed: Identify images removed by the user to delete them from Cloudinary storage
            const imagesToDelete = product.images.filter(imgUrl => !parsedExisting.includes(imgUrl));
            
            for (const imgUrl of imagesToDelete) {
                try {
                    // Extract public ID from the Cloudinary URL structure
                    const urlParts = imgUrl.split('/');
                    const fileNameWithExtension = urlParts[urlParts.length - 1];
                    const publicId = `products/${fileNameWithExtension.split('.')[0]}`; // Targets file inside 'products' folder
                    
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryErr) {
                    console.error("Failed to delete unused asset from Cloudinary:", cloudinaryErr.message);
                }
            }
            finalImages = parsedExisting;
        } else {
            // If existingImages is completely missing, it means the user deleted all past images
            if (product.images && product.images.length > 0) {
                for (const imgUrl of product.images) {
                    try {
                        const urlParts = imgUrl.split('/');
                        const fileNameWithExtension = urlParts[urlParts.length - 1];
                        const publicId = `products/${fileNameWithExtension.split('.')[0]}`;
                        await cloudinary.uploader.destroy(publicId);
                    } catch (err) {
                        console.error("Cloudinary cleanup error:", err.message);
                    }
                }
            }
            finalImages = [];
        }

        // Handle processing fresh image upload bundles
        if (req.files && req.files.length > 0) {
            const totalImageCount = finalImages.length + req.files.length;
            if (totalImageCount > 3) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
                return res.status(400).json({ success: false, message: `Maximum 3 images allowed. You tried to upload ${req.files.length} new photos but kept ${finalImages.length} old ones.` });
            }

            const uploadPromises = req.files.map((file) => {
                const normalizedPath = file.path.replace(/\\/g, '/');
                return cloudinary.uploader.upload(normalizedPath, {
                    folder: "products",
                    upload_preset: "images"
                });
            });

            const uploadResults = await Promise.all(uploadPromises);
            const newImageUrls = uploadResults.map((result) => result.secure_url);

            finalImages = [...finalImages, ...newImageUrls];

            for (const file of req.files) {
                await fsPromises.unlink(file.path).catch((err) =>
                    console.error("Failed to delete local temp file:", err.message)
                );
            }
        }

        product.images = finalImages;

        await product.save();
        return res.status(200).json({ success: true, product });

    } catch (error) {
        console.error("Error Updating Product", error);

        if (req.files) {
            for (const file of req.files) {
                await fsPromises.unlink(file.path).catch(() => { });
            }
        }

        next(error);
    }
};




export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const databaseUser = req.user; 
        
        if (!databaseUser) {
            return res.status(401).json({ success: false, message: "Unauthorized: User session missing." });
        }

    
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product Not Found" });
        }

        const isOwner = product.seller.equals(databaseUser._id);
        const isAdmin = databaseUser.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden: You do not have permission to delete this product." 
            });
        }

        if (product.images && product.images.length > 0) {
            const deletePromises = product.images.map((imageUrl) => {
                const parts = imageUrl.split("/upload/");
                if (parts.length > 1) {
                    const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
                    const publicId = pathAfterUpload.split(".")[0];

                    return cloudinary.uploader.destroy(publicId);
                }
            });

            await Promise.all(deletePromises.filter(Boolean));
        }

        await Product.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "Product Deleted Successfully" });

    } catch (error) {
        console.error("Error Deleting Product:", error);
        next(error);
    }
};



export const toggleAvailability = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id; 

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product listing not found." });
    }

    
     if (!product.seller.equals(userId)) {
      return res.status(403).json({ success: false, message: "Action denied. You do not own this listing." });
    }

    // 3. Reverse the boolean flag status
    product.isAvailable = !product.isAvailable;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product successfully marked as ${product.isAvailable ? "available" : "unavailable"}.`,
      product
    });
  } catch (error) {
    next(error)
  }
};



