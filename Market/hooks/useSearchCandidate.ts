import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api"; // Your custom configured Axios instance
import { JobSeekerProfile } from "../types"; // Your candidate interface types file

// 1. Define explicit structures for search arguments input states
export interface SearchCandidatesFilters {
    keyword?: string;
    region?: string;
    district?: string;
    workMode?: string;
    page?: number;
    limit?: number;
}

interface SearchCandidatesResponse {
    success: boolean;
    resultsCount: number;
    totalPages: number;
    currentPage: number;
    profiles: JobSeekerProfile[];
}

const fetchCandidatePool = async (filters: SearchCandidatesFilters): Promise<SearchCandidatesResponse> => {
    const response = await api.get<SearchCandidatesResponse>("/jobseeker/search", {
        params: {
            keyword: filters.keyword || undefined,
            region: filters.region || undefined,
            district: filters.district || undefined,
            workMode: filters.workMode || undefined,
            page: filters.page || 1,
            limit: filters.limit || 10,
        },
    });
    return response.data;
};

export const useSearchCandidate = (filters: SearchCandidatesFilters) => {
    return useQuery<SearchCandidatesResponse, Error>({
        
        queryKey: ["search-candidates", filters],
        queryFn: () => fetchCandidatePool(filters),
        placeholderData: (previousData) => previousData, 
        staleTime: 1000 * 60 * 2,
    });
};
