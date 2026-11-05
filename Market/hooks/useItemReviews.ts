import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ItemReview, ReportTargetType } from '../types';

interface GetItemReviewsResponse {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  reviewsPerPage: number;
  reviews: ItemReview[];
}

export const useItemReviews = (targetId: string, targetType: ReportTargetType, page = 1, limit = 10) => {
  const queryClient = useQueryClient();
  const queryKey = ['itemReviews', targetId, page, limit];

  const { data, isLoading, isError, refetch } = useQuery<GetItemReviewsResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<GetItemReviewsResponse>(
        `/reviews/item/${targetId}?page=${page}&limit=${limit}`
      );
      return data;
    },
    enabled: !!targetId,
  });

  // 2. Post a New Item Review
  const createItemReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      const { data } = await api.post<{ review: ItemReview }>('/reviews/item', {
        targetId,
        targetType,
        rating,
        comment,
      });
      return data.review;
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ['itemReviews', targetId] });
      queryClient.invalidateQueries({ queryKey: [targetType.toLowerCase(), targetId] });
    },
  });

  // 3. Delete an Item Review
  const deleteItemReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await api.delete(`/reviews/item/${reviewId}`);
      return reviewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemReviews', targetId] });
      queryClient.invalidateQueries({ queryKey: [targetType.toLowerCase(), targetId] });
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

    addItemReview: createItemReviewMutation.mutate,
    isAddingItemReview: createItemReviewMutation.isPending,
    addItemReviewError: createItemReviewMutation.error,

    deleteItemReview: deleteItemReviewMutation.mutate,
    isDeletingItemReview: deleteItemReviewMutation.isPending,
  };
};
