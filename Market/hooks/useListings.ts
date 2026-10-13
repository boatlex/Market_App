import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Product } from '../types'; 


interface UserProductsResponse {
  success: boolean;
  products: Product[];
}

const useListings = () => {
  const queryClient = useQueryClient();
 
  const { data, isLoading, isError, refetch } = useQuery<UserProductsResponse>({
    queryKey: ['products', 'my-listings'],
    queryFn: async () => {
      const response = await api.get('/products/user');
      return response.data; 
    }
  });
 

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error("Delete failed in hook context:", error);
    }
  });
 
  
  return {
    products: data?.products || [], 
    isLoading,
    isError,
    refetch,
    
    
    deleteProduct: deleteProductMutation.mutate,
    isDeletingProduct: deleteProductMutation.isPending,
    
    deletingProductId: deleteProductMutation.isPending ? deleteProductMutation.variables : null,
    
    
    deleteError: deleteProductMutation.error,
    isDeleteError: deleteProductMutation.isError,
    resetDeleteMutation: deleteProductMutation.reset
  };
};

export default useListings;
