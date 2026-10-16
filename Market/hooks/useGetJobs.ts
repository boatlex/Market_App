import { api } from "../lib/api"; 
import { useQuery } from "@tanstack/react-query";

export interface GetJobsFilters {
    category?: string;
    workMode?: string; 
    region?: string;
    district?: string; 
    search?: string;   
    page?: number;
    limit?: number;
}

export interface JobItem {
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
        period: 'monthly' | 'yearly' | 'hourly'; 
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
    applications?: string[] | any[]; 
    createdAt: string;
}

export interface GetJobsResponse {
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
            const response = await api.get<GetJobsResponse>("/jobs", {
                params: {
                    category: filters.category || undefined,
                    workMode: filters.workMode || undefined,
                    region: filters.region || undefined,
                    district: filters.district || undefined, 
                    search: filters.search || undefined,
                    page: filters.page || 1,
                    limit: filters.limit || 10,
                },
            });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, 
        refetchOnWindowFocus: false, 
    });
};
