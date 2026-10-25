import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface RemoveImageVariables {
    imageUrl: string;
}

interface RemoveImageResponse {
    success: boolean;
    message: string;
    portfolioImages: string[];
}

export const useRemovePortfolioImage = () => {
    const queryClient = useQueryClient();

    return useMutation<RemoveImageResponse, Error, RemoveImageVariables>({
        mutationFn: async (variables) => {
            
            const response = await api.delete<RemoveImageResponse>("/serviceproviders/portfolio-image", {
                data: { imageUrl: variables.imageUrl }
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["my-provider-profile"], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    profile: {
                        ...oldData.profile,
                        portfolioImages: data.portfolioImages 
                    }
                };
            });
        },
    });
};
