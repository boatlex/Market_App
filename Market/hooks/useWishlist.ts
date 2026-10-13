import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Product } from '../types'

// Define a unified interface for the backend JSON responses
interface WishListResponse {
  message: string;
  wishList: Product[]; // Both add, remove, and get endpoints return fully populated Product[] arrays
}

const useWishList = () => {
  const queryClient = useQueryClient()

  // 1. Fetch Wishlist Query
  const { data: wishList, isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get<WishListResponse>("/users/wishList")
      return data.wishList
    }
  })
 
  // 2. Add to Wishlist Mutation
  const addToWishListMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post<WishListResponse>("/users/wishList", { productId })
      return data.wishList
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['wishlist'], data)
    },
  })


  const removeFromWishListMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<WishListResponse>(`/users/wishList/${productId}`)
      return data.wishList
    },
    onSuccess: (data) => {
      // Optimistic update: Directly update the cache with the backend's new list
      queryClient.setQueryData(['wishlist'], data)
    },
  })

  // Helper: Check if a product is in the wishlist
  const isInWishList = (productId: string) => {
    return wishList?.some((product) => product._id === productId) ?? false
  }

  // Helper: Toggle wishlist status
  const toggleWishList = (productId: string) => {
    if (isInWishList(productId)) {
      removeFromWishListMutation.mutate(productId)
    } else {
      addToWishListMutation.mutate(productId)
    }
  }

  return {
    wishList: wishList || [],
    isError,
    isLoading,
    toggleWishList,
    refetch,
    addToWishList: addToWishListMutation.mutate,
    removeFromWishList: removeFromWishListMutation.mutate,
    isInWishList,
    wishListCount: wishList?.length || 0,
    // True/False flags are easier to parse in UI components than returning variables
    isAddingToWishList: addToWishListMutation.isPending, 
    isRemovingFromWishList: removeFromWishListMutation.isPending?
    removeFromWishListMutation.variables:null
  }
}

export default useWishList
