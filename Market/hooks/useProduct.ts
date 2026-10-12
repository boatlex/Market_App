import { api } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { Product } from '../types'

export const useProduct = (productId: string | undefined) => {
    const results = useQuery<Product>({
        queryKey: ["products", productId || 'skip'],
        queryFn: async () => {
            if (!productId) {
                throw new Error("Product ID is required");
            }
            const { data } = await api.get(`/products/${productId}`);
            
            if (!data || data.product === undefined) {
                throw new Error("Product payload data not found in server response");
            }
            
            return data.product;
        },
        enabled: typeof productId === 'string' && productId.trim().length > 0
    });

    return results;
};
