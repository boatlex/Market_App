import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface createReviewData {
    providerId: string;
    rating: number;
    comment: string;
}

export const useReviews = () => {
    const queryClient = useQueryClient();

    // 1. Create Review Mutation
    const createReview = useMutation({
        mutationFn: async (data: createReviewData) => {
            const response = await api.post("/reviews", data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidating "products" ensures the UI fetches the updated ratings
            queryClient.invalidateQueries({ queryKey: ["products"] });
        }
    });

    // 2. Delete Review Mutation
    const deleteReview = useMutation({
        mutationFn: async (reviewId: string) => {
            const response = await api.delete(`/reviews/${reviewId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        }
    });

    return {
    
        isCreatingReview: createReview.isPending,
        createReviewAsync: createReview.mutateAsync,
        
    
        isDeletingReview: deleteReview.isPending,
        deleteReviewAsync: deleteReview.mutateAsync
    };
};
