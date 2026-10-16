import { api } from "../lib/api"; // Your configured Axios instance
import { useQuery } from "@tanstack/react-query";

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

interface GetJobResponse {
    success: boolean;
    job: JobItem;
}

export const useGetJob = (jobId: string) => {
    return useQuery<GetJobResponse, Error>({
        
        queryKey: ["jobs", jobId],
        queryFn: async () => {
            const response = await api.get(`/jobs/${jobId}`);
            return response.data;
        },
         
        enabled: !!jobId,
        staleTime: 1000 * 60 * 5, // Keep static job specifics fresh for 5 minutes
    });
};
