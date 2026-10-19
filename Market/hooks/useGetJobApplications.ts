import { api } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

export interface ApplicantUser {
    _id: string;
    firstName?: string; 
    lastName?: string;  
    name?: string;      
    email: string;
    phoneNumber?: string;
}

export interface RecruiterApplicationItem {
    _id: string;
    job: string;
    applicant: ApplicantUser;
    resume: string;
    coverLetter?: string;
    status: 'Pending' | 'Reviewed' | 'Shortlisted' | 'Rejected' | 'Accepted';
    notesByEmployer?: string;
    createdAt: string;
}

interface GetJobApplicationsResponse {
    success: boolean;
    count: number;
    applications: RecruiterApplicationItem[];
}

export const useGetJobApplications = (jobId: string) => {
    return useQuery<GetJobApplicationsResponse, Error>({
        queryKey: ["job-applications", jobId],
        queryFn: async () => {
            const response = await api.get<GetJobApplicationsResponse>(`/applications/job/${jobId}`);
            return response.data;
        },
        enabled: !!jobId,
    });
};
