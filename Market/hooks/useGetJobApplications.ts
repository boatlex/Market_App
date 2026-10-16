import { api } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

export interface ApplicantUser {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
}

export interface RecruiterApplicationItem {
    _id: string;
    job: string;
    applicant: ApplicantUser;
    resume: string;
    coverLetter?: string;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
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
            const response = await api.get<GetJobApplicationsResponse>(`/jobs/${jobId}/applications`);
            return response.data;
        },
        enabled: !!jobId,
    });
};
