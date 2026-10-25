import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api"; 
import { JobSeekerProfile, WorkExperience, Education } from "../types";
interface DeleteProfileResponse {
    success: boolean;
    message: string;
}
export const useDeleteJobSeekerProfile = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteProfileResponse, Error, void>({
        mutationFn: async () => {
            
            const response = await api.delete<DeleteProfileResponse>("/jobseekerprofiles/profile");
            return response.data;
        },
        onSuccess: () => {
            
            queryClient.setQueryData(["my-job-seeking-ads"], { success: true, resultsCount: 0, profile: null });
            
            
            queryClient.setQueryData(["my-profile"], {
                isNewUser: true,
                profile: {
                    professionalHeadline: "",
                    bio: "",
                    skills: [],
                    experience: [],
                    education: [],
                    preferredJobTypes: [],
                    expectedSalary: { min: 0, currency: "GHS" },
                    profilePicture: "",
                    phoneNumber: "",
                    isSearchingForJob: true
                }
            });

            
            queryClient.invalidateQueries({ queryKey: ["search-candidates"] });
        },
    });
};