import { api } from "../lib/api";
import { useMutation } from "@tanstack/react-query";

interface GetReviewsVariables {
    providerId: string;
    page?: number;
    limit?: number;
}

export const useGetProviderReviewsMutation = () => {
    const mutation = useMutation({
        mutationFn: async ({ providerId, page = 1, limit = 10 }: GetReviewsVariables) => {
            const response = await api.get(`/reviews/provider/${providerId}`, {
                params: { page, limit }
            });
            return response.data;
        }
    });

    return {
        getReviewsAsync: mutation.mutateAsync,
        reviewsData: mutation.data,
        isLoadingReviews: mutation.isPending,
        isErrorReviews: mutation.isError,
        errorReviews: mutation.error
    };
};
