import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api'; 
import { ServiceProviderReview } from '../types';

interface GetProviderReviewsResponse {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  reviewsPerPage: number;
  reviews: ServiceProviderReview[];
}

export const useServiceProviderReviews = (providerId: string, page = 1, limit = 10) => {
  const queryClient = useQueryClient();
  const queryKey = ['providerReviews', providerId, page, limit];

  // 1. Fetch Paginated Provider Reviews
  const { data, isLoading, isError, refetch } = useQuery<GetProviderReviewsResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<GetProviderReviewsResponse>(
        `/reviews/provider/${providerId}?page=${page}&limit=${limit}`
      );
      return data;
    },
    enabled: !!providerId,
  });

  // 2. Post a New Provider Review
  const createReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      const { data } = await api.post<{ review: ServiceProviderReview }>('/reviews/provider', {
        providerId,
        rating,
        comment,
      });
      return data.review;
    },
    onSuccess: () => {
      // Invalidates reviews and triggers updates on provider stats immediately
      queryClient.invalidateQueries({ queryKey: ['providerReviews', providerId] });
      queryClient.invalidateQueries({ queryKey: ['serviceProvider', providerId] });
    },
  });

  // 3. Delete a Provider Review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await api.delete(`/reviews/provider/${reviewId}`);
      return reviewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerReviews', providerId] });
      queryClient.invalidateQueries({ queryKey: ['serviceProvider', providerId] });
    },
  });

  return {
    reviews: data?.reviews || [],
    totalReviews: data?.totalReviews || 0,
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    isLoading,
    isError,
    refetch,

    addReview: createReviewMutation.mutate,
    isAddingReview: createReviewMutation.isPending,
    addReviewError: createReviewMutation.error,

    deleteReview: deleteReviewMutation.mutate,
    isDeletingReview: deleteReviewMutation.isPending,
  };
};
