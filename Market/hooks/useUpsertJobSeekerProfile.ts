import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api"; 
import { JobSeekerProfile, WorkExperience, Education } from "../types";

export interface UpsertProfileVariables {
    professionalHeadline: string;
    bio?: string;
    skills: string[];
    experience: WorkExperience[];
    education: Education[];
    preferredJobTypes: string[];
    expectedSalaryMin?: number;
    expectedSalaryCurrency: string;
    isSearchingForJob: boolean;
    region?: string;    
    district?: string;  
    location?: string;  
    workMode?: string;  
    profilePictureFile?: {
        uri: string;
        name: string;
        type: string;
    } | null; 
}

interface UpsertProfileResponse {
    message: string;
    profile: JobSeekerProfile;
}

export const useUpsertJobSeekerProfile = () => {
    const queryClient = useQueryClient();

    return useMutation<UpsertProfileResponse, Error, UpsertProfileVariables>({
        mutationFn: async (variables) => {
            const formData = new FormData();

            
            formData.append("professionalHeadline", variables.professionalHeadline);
            if (variables.bio) formData.append("bio", variables.bio);
            formData.append("expectedSalaryMin", String(variables.expectedSalaryMin || 0));
            formData.append("expectedSalaryCurrency", variables.expectedSalaryCurrency);
            formData.append("isSearchingForJob", String(variables.isSearchingForJob));
            
            
            if (variables.region) formData.append("region", variables.region);
            if (variables.district) formData.append("district", variables.district);
            if (variables.location) formData.append("location", variables.location);
            if (variables.workMode) formData.append("workMode", variables.workMode);

            
            formData.append("skills", JSON.stringify(variables.skills));
            formData.append("preferredJobTypes", JSON.stringify(variables.preferredJobTypes));
            formData.append("experience", JSON.stringify(variables.experience));
            formData.append("education", JSON.stringify(variables.education));

            
            if (variables.profilePictureFile) {
                formData.append("image", variables.profilePictureFile as any);
            }

        
            
            const response = await api.put<UpsertProfileResponse>(
                "/jobseekerprofiles/profile", 
                formData, 
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        },
    });
};
