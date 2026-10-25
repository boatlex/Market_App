import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ServiceProvider, AvailabilityStatus } from "../types";

export interface SearchProvidersParams {
    keyword?: string;
    region?: string;
    district?: string;
    category?: string;     
    serviceType?: string;  
    availabilityStatus?: AvailabilityStatus;
    page?: number;
    limit?: number;
}

interface SearchProvidersResponse {
    success: boolean;
    resultsCount: number;
    totalPages: number;
    currentPage: number;
    providers: ServiceProvider[];
}

export const useSearchServiceProviders = (filters: SearchProvidersParams) => {
    return useQuery<SearchProvidersResponse, Error>({
         
        queryKey: ["search-service-providers", filters],
        queryFn: async () => {
            const response = await api.get<SearchProvidersResponse>("/serviceproviders/search", {
                params: filters, 
            });
            return response.data;
        },
    });
};
