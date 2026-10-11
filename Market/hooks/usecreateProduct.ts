import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PickerImage {
    uri: string;
    type?: string;   
    name?: string;   
}

interface CreateProductVariables {
    name: string;
    description: string;
    price: number | string;
    phoneNumber: string;
    category: string;
    productType: string;
    region: string;
    district: string; 
    location: string;
    condition: string; // 🛠️ FIX 1: Add missing condition property to types
    images: PickerImage[]; 
    warranty?: string;
    brand?: string;
    color?: string;
    delivery?: {
        from?: string;
        to?: string;
    };
}

export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    const createProductMutation = useMutation({
        mutationFn: async (data: CreateProductVariables) => {
            const formData = new FormData();

            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("price", String(data.price));
            formData.append("phoneNumber", data.phoneNumber);
            formData.append("category", data.category);
            formData.append("productType", data.productType);
            formData.append("region", data.region);
            formData.append("district", data.district); 
            formData.append("location", data.location);  
            formData.append("condition", data.condition); 

            if (data.warranty) formData.append("warranty", data.warranty);
            if (data.brand) formData.append("brand", data.brand);
            if (data.color) formData.append("color", data.color);
            
            if (data.delivery) {
                formData.append("delivery", JSON.stringify(data.delivery));
            }

            data.images.forEach((img, index) => {
                const fileType = img.type || "image/jpeg";
                const fileName = img.name || `image_${index}_${Date.now()}.jpg`;

                formData.append("images", {
                    uri: img.uri,
                    type: fileType,
                    name: fileName,
                } as any); 
            });

            const response = await api.post("/products", formData, {
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
        createProductAsync: createProductMutation.mutateAsync,
        isCreatingProduct: createProductMutation.isPending,
        isErrorCreating: createProductMutation.isError,
        errorCreating: createProductMutation.error,
    };
};
