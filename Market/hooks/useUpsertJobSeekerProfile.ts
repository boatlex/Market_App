import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api"; 
import { JobSeekerProfile, WorkExperience, Education } from "../types";

// 1. Added explicit types for pseudo-file uploads in React Native FormDatas
export interface FormDataFile {
    uri: string;
    name: string;
    type: string;
}

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
    phoneNumber: string; 
    workMode?: string;  
    profilePictureFile?: FormDataFile | null; 
    resumeFile?: FormDataFile | null; // 👈 ADDED: Explicit variable pointer for PDF document picks
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

            // Text primitives mappings
            formData.append("professionalHeadline", variables.professionalHeadline);
            if (variables.bio) formData.append("bio", variables.bio);
            formData.append("expectedSalaryMin", String(variables.expectedSalaryMin || 0));
            formData.append("expectedSalaryCurrency", variables.expectedSalaryCurrency);
            formData.append("isSearchingForJob", String(variables.isSearchingForJob));
            
            if (variables.region) formData.append("region", variables.region);
            if (variables.district) formData.append("district", variables.district);
            if (variables.location) formData.append("location", variables.location);
            if (variables.workMode) formData.append("workMode", variables.workMode);
            if (variables.phoneNumber) formData.append("phoneNumber", variables.phoneNumber);

            // Serialization blocks matching backend JSON.parse utilities
            formData.append("skills", JSON.stringify(variables.skills));
            formData.append("preferredJobTypes", JSON.stringify(variables.preferredJobTypes));
            formData.append("experience", JSON.stringify(variables.experience));
            formData.append("education", JSON.stringify(variables.education));

            // Image attachment pipeline mapping
            if (variables.profilePictureFile) {
                formData.append("image", variables.profilePictureFile as any);
            }

            //  Resume attachment pipeline matching backend router upload.fields key
            if (variables.resumeFile) {
                formData.append("resume", variables.resumeFile as any);
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
        onSuccess: (data) => {
            // Synchronize local screen data streams matching getMyJobSeekingAds layout formats
            queryClient.setQueryData(["my-job-seeking-ads"], { success: true, resultsCount: 1, profile: data.profile });
            queryClient.setQueryData(["my-profile"], { isNewUser: false, profile: data.profile });

            queryClient.invalidateQueries({ queryKey: ["search-candidates"], refetchType: "none" });
        },
    });
};
