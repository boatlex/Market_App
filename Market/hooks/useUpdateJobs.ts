import { api } from "../lib/api"; // Your configured Axios instance
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PickerImage {
    uri: string;
    type?: string;   
    name?: string;   
}


interface UpdateJobVariables {
    id: string; 
    companyName?: string;
    title?: string;
    description?: string;
    category?: string;
    jobType?: string;
    workMode?: string;
    minSalary?: number | string | null;
    maxSalary?: number | string | null;
    currency?: string;
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
            const { id, ...updateFields } = data;

            
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

            
            if (updateFields.minSalary !== undefined) formData.append("minSalary", updateFields.minSalary !== null ? String(updateFields.minSalary) : "");
            if (updateFields.maxSalary !== undefined) formData.append("maxSalary", updateFields.maxSalary !== null ? String(updateFields.maxSalary) : "");

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

        
            if (updateFields.jobImage) {
                const fileType = updateFields.jobImage.type || "image/jpeg";
                const fileName = updateFields.jobImage.name || `job_update_${Date.now()}.jpg`;

                formData.append("image", {
                    uri: updateFields.jobImage.uri,
                    type: fileType,
                    name: fileName,
                } as any);
            }

            
            const response = await api.patch(`/jobs/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            queryClient.invalidateQueries({ queryKey: ["jobs", variables.id] }); 
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
