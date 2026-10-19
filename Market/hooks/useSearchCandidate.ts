import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { JobSeekerProfile } from "../types";

export interface SearchCandidatesFilters {
    page: number;
    limit: number;
    keyword: string;
    region: string;
    district: string;
    workMode: string;
}

interface SearchResponse {
    success: boolean;
    profiles: JobSeekerProfile[];
    resultsCount: number;
}

export const useSearchCandidate = (filters: SearchCandidatesFilters) => {
    return useQuery<SearchResponse, Error>({
        queryKey: ["search-candidates", filters],
        queryFn: async () => {
            const { data } = await api.get<SearchResponse>("/jobseekerprofiles/search", {
                params: filters
            });
            return data;
        },
        
        enabled: !!filters,
        retry: false,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData, 
        refetchOnReconnect: false,   
        refetchOnMount: false,   
    });
};
