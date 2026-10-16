import { api } from "../lib/api"; 
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ApplyJobVariables {
    jobId: string;
    coverLetter?: string;
}

interface ApplyJobResponse {
    success: boolean;
    message: string;
    application: any;
}

export const useApplyToJob = () => {
    const queryClient = useQueryClient();

    return useMutation<ApplyJobResponse, Error, ApplyJobVariables>({
        mutationFn: async ({ jobId, coverLetter }) => {
            const response = await api.post<ApplyJobResponse>(`/jobs/${jobId}/apply`, {
                coverLetter
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            
            queryClient.invalidateQueries({ queryKey: ["jobs", variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ["my-applications"] });
        }
    });
};
