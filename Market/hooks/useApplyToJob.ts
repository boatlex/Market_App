import { api } from "../lib/api"; 
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Application } from "../types";

interface ApplyJobVariables {
    jobId: string;
    coverLetter?: string; 
}

interface ApplyJobResponse {
    success: boolean;
    message: string;
    application: Application;
}

export const useApplyToJob = () => {
    const queryClient = useQueryClient();

    return useMutation<ApplyJobResponse, Error, ApplyJobVariables>({   
        mutationFn: async ({ jobId, coverLetter }) => {
            console.log("Submitting job application setup payload details:", "JobId:", jobId, "Coverletter:", coverLetter);
            
            const response = await api.post<ApplyJobResponse>(`/applications/job/${jobId}/apply`, {
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
