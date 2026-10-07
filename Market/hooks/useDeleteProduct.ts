import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    const deleteProductMutation = useMutation({
        mutationFn: async (productId: string) => {
            const response = await api.delete(`/products/${productId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["products", "my-listings"] });
        },
    });

    return {
        deleteProductAsync: deleteProductMutation.mutateAsync,
        isDeletingProduct: deleteProductMutation.isPending,
        isErrorDeleting: deleteProductMutation.isError,
        errorDeleting: deleteProductMutation.error,
    };
};
