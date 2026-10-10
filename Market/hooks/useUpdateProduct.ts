import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PickerImage {
    uri: string;
    type?: string;   
    name?: string;   
}

interface UpdateProductVariables {
    productId: string;
    name?: string;
    description?: string;
    price?: number | string;
    phoneNumber?: string;
    category?: string;
    productType?: string;
    region?: string;
    district?: string; // Fixed: Added support for your new schema district field
    location?: string;
    images?: PickerImage[]; 
    existingImages?: string[];
    // Fixed: Added support for optional attributes matching your form payload updates
    warranty?: string;
    brand?: string;
    color?: string;
    delivery?: {
        from?: string;
        to?: string;
    };
}

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    const updateProductMutation = useMutation({
        mutationFn: async ({ productId, ...data }: UpdateProductVariables) => {
            const formData = new FormData();

            if (data.name) formData.append("name", data.name);
            if (data.description) formData.append("description", data.description);
            if (data.price) formData.append("price", String(data.price));
            if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
            if (data.category) formData.append("category", data.category);
            if (data.productType) formData.append("productType", data.productType);
            if (data.region) formData.append("region", data.region);
            if (data.district) formData.append("district", data.district); // Fixed: Appending district configuration
            if (data.location) formData.append("location", data.location);

            // Fixed: Safely append optional parameter configurations if modified
            if (data.warranty) formData.append("warranty", data.warranty);
            if (data.brand) formData.append("brand", data.brand);
            if (data.color) formData.append("color", data.color);
            
            if (data.delivery) {
                // Multi-part data payloads require objects to be text-stringified for transportation
                formData.append("delivery", JSON.stringify(data.delivery));
            }

            // Append existing remote image arrays to keep or reorganize on backend storage paths
            if (data.existingImages && data.existingImages.length > 0) {
                data.existingImages.forEach((url) => {
                    formData.append("existingImages", url);
                });
            } else if (data.existingImages && data.existingImages.length === 0) {
                formData.append("existingImages", "");
            }

            // Append newly added binary local files
            if (data.images && data.images.length > 0) {
                data.images.forEach((img, index) => {
                    const fileType = img.type || "image/jpeg";
                    const fileName = img.name || `update_${index}_${Date.now()}.jpg`;

                    formData.append("images", {
                        uri: img.uri,
                        type: fileType,
                        name: fileName,
                    } as any);
                });
            }

            const response = await api.put(`/products/${productId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["products", "my-listings"] });
            queryClient.invalidateQueries({ queryKey: ["product-detail"] });
        },
    });

    return {
        updateProductAsync: updateProductMutation.mutateAsync,
        isUpdatingProduct: updateProductMutation.isPending,
    };
};
