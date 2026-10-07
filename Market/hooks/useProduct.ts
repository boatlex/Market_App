import { api } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { Product } from '../types'


export const useProduct = (productId: string | undefined) => {
    const results = useQuery<Product>({
        queryKey: ["products", productId || ''],
        queryFn: async () => {
            if (!productId) throw new Error("Product ID is required");
            const { data } = await api.get(`/products/${productId}`)
            return data.product
        },

        enabled: !!productId

    })


    return results

}

