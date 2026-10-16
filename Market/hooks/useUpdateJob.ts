import { api } from "../lib/api"; // Your configured Axios instance
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface PickerImage {
    uri: string;
    isRemote?: boolean; 
    type?: string;   
    name?: string;   
}

export interface UpdateJobVariables {
    _id: string; 
    companyName?: string;
    title?: string;
    description?: string;
    category?: string;
    jobType?: string;
    workMode?: string;
    // Normalized variables contract matching your form text fields
    salaryMin?: number | string | null;
    salaryMax?: number | string | null;
    currency?: string;
    salaryPeriod?: string;
    phoneNumber?: string;
    emailForApplications?: string;
    region?: string;
    district?: string;
    location?: string;
    requirements?: string[];
    benefits?: string[];
    applicationDeadline?: string | Date | null; 
    jobImage?: PickerImage | null; 
}

export const useUpdateJob = () => {
    const queryClient = useQueryClient();

    const updateJobMutation = useMutation({
        mutationFn: async (data: UpdateJobVariables) => {
            const formData = new FormData();
            const { _id, jobImage, ...updateFields } = data; // Pull out jobImage to handle conditionally

            
            if (updateFields.companyName !== undefined) formData.append("companyName", updateFields.companyName);
            if (updateFields.title !== undefined) formData.append("title", updateFields.title);
            if (updateFields.description !== undefined) formData.append("description", updateFields.description);
            if (updateFields.category !== undefined) formData.append("category", updateFields.category);
            if (updateFields.jobType !== undefined) formData.append("jobType", updateFields.jobType);
            if (updateFields.workMode !== undefined) formData.append("workMode", updateFields.workMode);
            if (updateFields.phoneNumber !== undefined) formData.append("phoneNumber", updateFields.phoneNumber);
            if (updateFields.emailForApplications !== undefined) formData.append("emailForApplications", updateFields.emailForApplications);
            if (updateFields.region !== undefined) formData.append("region", updateFields.region);
            if (updateFields.district !== undefined) formData.append("district", updateFields.district);
            if (updateFields.location !== undefined) formData.append("location", updateFields.location);
            if (updateFields.currency !== undefined) formData.append("currency", updateFields.currency);
            if (updateFields.salaryPeriod !== undefined) formData.append("salaryPeriod", updateFields.salaryPeriod);

            
            if (updateFields.salaryMin !== undefined) formData.append("salaryMin", updateFields.salaryMin !== null ? String(updateFields.salaryMin) : "0");
            if (updateFields.salaryMax !== undefined) formData.append("salaryMax", updateFields.salaryMax !== null ? String(updateFields.salaryMax) : "0");

            if (updateFields.applicationDeadline !== undefined) {
                if (updateFields.applicationDeadline === null) {
                    formData.append("applicationDeadline", "");
                } else {
                    const dateStr = updateFields.applicationDeadline instanceof Date 
                        ? updateFields.applicationDeadline.toISOString() 
                        : updateFields.applicationDeadline;
                    formData.append("applicationDeadline", dateStr);
                }
            }

            
            if (updateFields.requirements !== undefined) {
                formData.append("requirements", JSON.stringify(updateFields.requirements));
            }
            if (updateFields.benefits !== undefined) {
                formData.append("benefits", JSON.stringify(updateFields.benefits));
            }

            
            if (jobImage) {
                if (jobImage.isRemote) {
                    formData.append("jobImage", jobImage.uri);
                } else {
                    
                    const fileType = jobImage.type || "image/jpeg";
                    const fileName = jobImage.name || `job_update_${Date.now()}.jpg`;

                    formData.append("image", {
                        uri: jobImage.uri,
                        type: fileType,
                        name: fileName,
                    } as any);
                }
            }

            
            const response = await api.put(`/jobs/${_id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            queryClient.invalidateQueries({ queryKey: ["jobs", variables._id] }); 
            queryClient.invalidateQueries({ queryKey: ["jobs", "my-posted-jobs"] });
        },
    });

    return {
        updateJobAsync: updateJobMutation.mutateAsync,
        isUpdatingJob: updateJobMutation.isPending,
        isErrorUpdatingJob: updateJobMutation.isError,
        errorUpdatingJob: updateJobMutation.error,
    };
};
