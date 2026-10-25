import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface DeleteProviderResponse {
    success: boolean;
    message: string;
}

export const useDeleteServiceProvider = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteProviderResponse, Error, void>({
        mutationFn: async () => {
            const response = await api.delete<DeleteProviderResponse>("/serviceproviders/profile");
            return response.data;
        },
        onSuccess: () => {
            queryClient.setQueryData(["my-provider-profile"], {
                success: true,
                isNewProvider: true,
                profile: null
            });
            queryClient.invalidateQueries({ queryKey: ["search-service-providers"] });
        },
    });
};
