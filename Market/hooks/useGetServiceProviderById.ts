import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ServiceProvider } from "../types";

interface GetProviderByIdResponse {
    success: boolean;
    data: ServiceProvider;
}

export const useGetServiceProviderById = (providerId: string) => {
    return useQuery<GetProviderByIdResponse, Error>({
        // Enforces cache updates when shifting between candidate portfolio cards
        queryKey: ["service-provider", providerId],
        queryFn: async () => {
            const response = await api.get<GetProviderByIdResponse>(`/serviceproviders/${providerId}`);
            return response.data;
        },
        enabled: Boolean(providerId), // Prevents automatic queries if parameter strings are blank
    });
};
