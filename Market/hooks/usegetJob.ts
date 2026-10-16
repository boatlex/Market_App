import { api } from "../lib/api"; 
import { useQuery } from "@tanstack/react-query";

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
    createdAt: string;
}

interface GetJobResponse {
    success: boolean;
    job: JobItem;
}

export const useGetJob = (jobId: string) => {
    return useQuery<GetJobResponse, Error, JobItem>({
        queryKey: ["jobs", jobId],
        queryFn: async () => {
            const response = await api.get<GetJobResponse>(`/jobs/${jobId}`);
            return response.data;
        },
        
        select: (data) => data.job,
        enabled: !!jobId,
        staleTime: 1000 * 60 * 5, 
    });
};
