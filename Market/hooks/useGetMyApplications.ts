import { api } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

export interface ApplicationItem {
    _id: string;
    job: {
        _id: string;
        title: string;
        companyName: string;
        region: string;
        district: string;
        isOpen: boolean;
    };
    // Aligned to match your Mongoose Schema status flags capitalization
    status: 'Pending' | 'Reviewed' | 'Interviewing' | 'Hired' | 'Rejected'; 
    notesByEmployer?: string;
    createdAt: string;
}

interface GetApplicationsResponse {
    success: boolean;
    count: number;
    applications: ApplicationItem[];
}

export const useGetMyApplications = () => {
    return useQuery<GetApplicationsResponse, Error>({
        queryKey: ["my-applications"],
        queryFn: async () => {
            const response = await api.get<GetApplicationsResponse>("/applications/my-applications");
            return response.data;
        },
        staleTime: 1000 * 60 * 3, 
    });
};
