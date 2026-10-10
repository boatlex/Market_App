import { api } from '../lib/api';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Product } from '../types';

interface GetProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    totalProducts: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface ProductFilters {
  limit?: number;
  search?: string;
  category?: string;
  productType?: string;
  region?: string;
  district?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
}

const useProducts = (filters: ProductFilters) => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ["products", filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const activeParams = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const { data } = await api.get<GetProductsResponse>("/products", {
        params: { ...activeParams, page: pageParam, limit: activeParams.limit || 10 }
      });
      return data;
    },
    // Determines the next page query parameter index sequentially
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage ? lastPage.pagination.currentPage + 1 : undefined;
    }
  });

  // Flatten the array of pages into a single continuous list of products
  const results = data?.pages.flatMap((page) => page.products) || [];

  return {
    results,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  };
};

export default useProducts;
