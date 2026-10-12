import { api } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useToggleAvailability = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            const { data } = await api.patch(`/products/${productId}/toggle-availability`);
            return data; 
        },
        onSuccess: (responseData, productId) => {
            
            queryClient.setQueryData(["products", productId], responseData.product);
            
            queryClient.invalidateQueries({ queryKey: ["products", productId] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        }
    });
};
