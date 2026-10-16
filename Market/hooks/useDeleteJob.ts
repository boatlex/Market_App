import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

interface DeleteJobResponse {
    success: boolean;
    message: string;
}

export const useDeleteJob = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteJobResponse, Error, string>({
        mutationFn: async (jobId: string) => {
            const response = await api.delete(`/jobs/${jobId}`);
            return response.data;
        },
        
        onSuccess: (data, jobId) => {
            Alert.alert(
                "Listing Removed",
                data.message || "The vacancy details have been cleared from public feeds.",
                [{ text: "OK" }]
            );

            
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            queryClient.invalidateQueries({ queryKey: ["jobs", "my-posted-jobs"] });
            queryClient.removeQueries({ queryKey: ["jobs", jobId] });
        },
        
        onError: (error: any) => {
            const backendErrorMessage = error?.response?.data?.message || error?.message;
            
            Alert.alert(
                "Action Denied",
                backendErrorMessage || "Could not complete deletion. Please verify your connection.",
                [{ text: "Dismiss", style: "cancel" }]
            );
        }
    });
};
