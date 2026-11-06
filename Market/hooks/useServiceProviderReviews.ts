import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native'; // 🌟 Import Alert from react-native
import { api } from '../lib/api'; 
import { ServiceProviderReview } from '../types';

interface PaginatedReviewsPayload {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  reviewsPerPage: number;
  reviews: ServiceProviderReview[];
}

interface GetProviderReviewsResponse {
  success: boolean;
  message?: string;
  data: PaginatedReviewsPayload;
}

export const useServiceProviderReviews = (providerId: string, page = 1, limit = 10) => {
  const queryClient = useQueryClient();
  const queryKey = ['providerReviews', providerId, page, limit];

  const { data, isLoading, isError, refetch } = useQuery<GetProviderReviewsResponse>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<GetProviderReviewsResponse>(
        `/reviews/provider/${providerId}?page=${page}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!providerId,
  });

  
  const createReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      const response = await api.post<{ success: boolean; data: ServiceProviderReview }>('/reviews/provider', {
        providerId,
        rating,
        comment,
      });
      return response.data.data;
    },
    onSuccess: () => {
      
      Alert.alert("Success", "Your review has been posted successfully!");

      queryClient.invalidateQueries({ queryKey: ['providerReviews', providerId], exact: false });
      queryClient.invalidateQueries({ queryKey: ['serviceProvider', providerId], exact: false });
    },
    onError: (error: any) => {
      
      const errorMessage = error?.response?.data?.message || "Could not submit your review. Please try again.";
      Alert.alert("Submission Failed", errorMessage);
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await api.delete(`/reviews/provider/${reviewId}`);
      return reviewId;
    },
    onSuccess: () => {
      Alert.alert("Review Removed", "Your review was successfully deleted.");

      queryClient.invalidateQueries({ queryKey: ['providerReviews', providerId], exact: false });
      queryClient.invalidateQueries({ queryKey: ['serviceProvider', providerId], exact: false });
    },
    onError: (error: any) => {
      // 🌟 Error Alert
      const errorMessage = error?.response?.data?.message || "Could not delete this review.";
      Alert.alert("Error", errorMessage);
    }
  });

  return {
    reviews: data?.data?.reviews || [],
    totalReviews: data?.data?.totalReviews || 0,
    totalPages: data?.data?.totalPages || 1,
    currentPage: data?.data?.currentPage || 1,
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
