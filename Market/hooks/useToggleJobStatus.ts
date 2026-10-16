import { api } from "../lib/api"; // Your configured Axios instance
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { JobItem } from "./useGetJobs";

interface ToggleStatusResponse {
    success: boolean;
    message: string;
    job: JobItem;
}

export const useToggleJobStatus = () => {
    const queryClient = useQueryClient();

    return useMutation<ToggleStatusResponse, Error, string>({
        mutationFn: async (jobId: string) => {
            const response = await api.patch<ToggleStatusResponse>(`/jobs/${jobId}/toggle-status`);
            return response.data;
        },
        onSuccess: (data, jobId) => {
            queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
            
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        }
    });
};
