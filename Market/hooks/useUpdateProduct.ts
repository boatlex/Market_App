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
    location?: string;
    images?: PickerImage[]; 
}

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    const updateProductMutation = useMutation({
        mutationFn: async ({ productId, ...data }: UpdateProductVariables) => {
            const formData = new FormData();

            // 1. Conditionally append text fields only if they are provided
            if (data.name) formData.append("name", data.name);
            if (data.description) formData.append("description", data.description);
            if (data.price) formData.append("price", String(data.price));
            if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
            if (data.category) formData.append("category", data.category);
            if (data.productType) formData.append("productType", data.productType);
            if (data.region) formData.append("region", data.region);
            if (data.location) formData.append("location", data.location);

            // 2. Append new images if the seller is updating photos
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
        },
    });

    return {
        updateProductAsync: updateProductMutation.mutateAsync,
        isUpdatingProduct: updateProductMutation.isPending,
        isErrorUpdating: updateProductMutation.isError,
        errorUpdating: updateProductMutation.error,
    };
};
