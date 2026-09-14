import { Product } from "../models/product.model";
import { User } from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js"
import { Product } from "./path/to/your/productModel.js";


import { promises as fsPromises } from 'fs';
import { Product } from "./path-to-your-product-model.js";

export const createProduct = async (req, res, next) => {
    try {
        const {
            seller,
            name,
            description,
            price,
            phoneNumber,
            category,
            productType,
            region,
            location
        } = req.body;

        if (!seller || !name || !description || !price || !phoneNumber || !category || !productType || !region || !location) {
            if (req.files) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
            }
            return res.status(400).json({ message: "All text fields are required" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one image file is required" });
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

        const product = await Product.create({
            seller,
            name,
            description,
            price: parseFloat(price),
            phoneNumber: phoneNumber.trim(),
            productType,
            region,
            location,
            category,
            images: imageUrls
        });

        return res.status(201).json({ product });

    } catch (error) {
        console.error("Error Creating Product:", error);

        if (req.files) {
            for (const file of req.files) {
                await fsPromises.unlink(file.path).catch(() => { });
            }
        }

        next(error)
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
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .populate("seller", "firstName lastName profilePicture")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "firstName lastName profilePicture"
                }
            })

        res.status(200).json({ products })
    } catch (error) {
        next(error)
    }
}

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
        const clerkAuth = typeof getAuth === 'function' ? getAuth(req) : {};
        const clerkUserId = clerkAuth?.userId;
        const m_userId = req.user?._id;

        let databaseUser;
        if (m_userId) {
            databaseUser = await User.findById(m_userId);
        } else if (clerkUserId) {
            databaseUser = await User.findOne({ clerkId: clerkUserId });
        }


        if (!databaseUser) {
            return res.status(404).json({ error: "User Not Found" });
        }


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


        return res.status(200).json({ products });

    } catch (error) {
        next(error);
    }
}

export const updateProduct = async (req, res, next) => {
    try {
        const {
            seller,
            name,
            description,
            price,
            phoneNumber,
            category,
            productType,
            region,
            location,
            existingImages
        } = req.body;

        const { id } = req.params;


        const product = await Product.findById(id);
        if (!product) {
            if (req.files) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
            }
            return res.status(404).json({ message: "Product Not Found" });
        }

        if (seller) product.seller = seller;
        if (name) product.name = name;
        if (description) product.description = description;
        if (price !== undefined) product.price = parseFloat(price);
        if (phoneNumber !== undefined) product.phoneNumber = phoneNumber.trim();
        if (category) product.category = category;
        if (productType) product.productType = productType;
        if (region) product.region = region;
        if (location) product.location = location;


        if (req.files && req.files.length > 0) {
            if (req.files.length > 3) {
                for (const file of req.files) await fsPromises.unlink(file.path).catch(() => { });
                return res.status(400).json({ message: "Maximum 3 images allowed" });
            }

            const uploadPromises = req.files.map((file) => {
                const normalizedPath = file.path.replace(/\\/g, '/');
                return cloudinary.uploader.upload(normalizedPath, {
                    folder: "products",
                    upload_preset: "images"
                });
            });

            const uploadResults = await Promise.all(uploadPromises);

            product.images = uploadResults.map((result) => result.secure_url);

            for (const file of req.files) {
                await fsPromises.unlink(file.path).catch((err) =>
                    console.error("Failed to delete local temp file:", err.message)
                );
            }

        } else if (existingImages !== undefined) {
            product.images = Array.isArray(existingImages) ? existingImages : [existingImages];
        }


        await product.save();
        return res.status(200).json({ product });

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
        const clerkAuth = typeof getAuth === 'function' ? getAuth(req) : {};
        const clerkUserId = clerkAuth?.userId;
        const m_userId = req.user?._id; 

        
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product Not Found" });
        }

        let databaseUser;
        if (m_userId) {
            databaseUser = await User.findById(m_userId);
        } else if (clerkUserId) {
            databaseUser = await User.findOne({ clerkId: clerkUserId });
        }

        
        if (!databaseUser) {
            return res.status(401).json({ message: "Unauthorized: User not found." });
        }

        const isOwner = product.seller.equals(databaseUser._id);
        const isAdmin = databaseUser.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
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

        return res.status(200).json({ message: "Product Deleted Successfully" });

    } catch (error) {
        console.error("Error Deleting Product:", error);
        next(error);
    }
};



