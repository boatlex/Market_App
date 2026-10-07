import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";


interface PickerImage {
    uri: string;
    type?: string;   // e.g., 'image/jpeg'
    name?: string;   // e.g., 'photo.jpg'
}

interface CreateProductVariables {
    name: string;
    description: string;
    price: number | string;
    phoneNumber: string;
    category: string;
    productType: string;
    region: string;
    location: string;
    images: PickerImage[]; 
}

export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    const createProductMutation = useMutation({
        mutationFn: async (data: CreateProductVariables) => {
            const formData = new FormData();

            // 1. Append text fields
            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("price", String(data.price));
            formData.append("phoneNumber", data.phoneNumber);
            formData.append("category", data.category);
            formData.append("productType", data.productType);
            formData.append("region", data.region);
            formData.append("location", data.location);

            // 2. Format and append images for React Native multipart upload
            data.images.forEach((img, index) => {
                // Infer type and name if your picker doesn't automatically supply them
                const fileType = img.type || "image/jpeg";
                const fileName = img.name || `image_${index}_${Date.now()}.jpg`;

                // React Native requires this precise object shape wrapped inside FormData
                formData.append("images", {
                    uri: img.uri,
                    type: fileType,
                    name: fileName,
                } as any); 
            });

            // 3. Post to API (React Native automatically formats headers if Content-Type is left open or multipart)
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
