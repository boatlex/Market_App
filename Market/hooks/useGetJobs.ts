import { api } from "../lib/api"; 
import { useQuery } from "@tanstack/react-query";


interface GetJobsFilters {
    category?: string;
    workMode?: string; 
    region?: string;
    search?: string;   
    page?: number;
    limit?: number;
}


interface JobItem {
    _id: string;
    employer: string;
    companyName: string;
    jobImage?: string;
    title: string;
    description: string;
    category: string;
    jobType: string;
    workMode: string;
    salary: {
        min?: number;
        max?: number;
        currency: string;
    };
    phoneNumber?: string;
    emailForApplications?: string;
    region: string;
    district: string;
    location: string;
    requirements: string[];
    benefits: string[];
    applicationDeadline?: string;
    isOpen: boolean;
    createdAt: string;
}

interface GetJobsResponse {
    success: boolean;
    count: number;
    jobs: JobItem[];
    pagination?: {
        currentPage: number;
        totalPages: number;
    };
}

export const useGetJobs = (filters: GetJobsFilters = {}) => {
    return useQuery<GetJobsResponse, Error>({
        queryKey: ["jobs", filters],
        queryFn: async () => {
            const response = await api.get("/jobs", {
                params: {
                    category: filters.category || undefined,
                    workMode: filters.workMode || undefined,
                    region: filters.region || undefined,
                    search: filters.search || undefined,
                    page: filters.page || 1,
                    limit: filters.limit || 10,
                },
            });
            return response.data;
        },
        // Helpful configurations for mobile devices
        staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
        refetchOnWindowFocus: false, // Prevents aggressive battery drain on app focus switches
    });
};
