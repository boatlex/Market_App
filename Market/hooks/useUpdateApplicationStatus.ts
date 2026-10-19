import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateStatusVariables {
    applicationId: string;
    status: 'Pending' | 'Reviewed' | 'Interviewing' | 'Hired' | 'Rejected';
    notesByEmployer?: string;
}

export const useUpdateApplicationStatus = (jobId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ applicationId, status, notesByEmployer }: UpdateStatusVariables) => {
            const response = await api.patch(`/applications/${applicationId}/status`, {
                status,
                notesByEmployer
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
            queryClient.invalidateQueries({ queryKey: ["my-applications"] });
        }
    });
};
