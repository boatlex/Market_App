import { api } from "../lib/api"; // Your configured Axios instance
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PickerImage {
    uri: string;
    type?: string;   
    name?: string;   
}

interface CreateJobVariables {
    companyName: string;
    title: string;
    description: string;
    category: string;
    jobType: string;
    workMode: string;
    minSalary?: number | string;
    maxSalary?: number | string;
    currency?: string;
    phoneNumber?: string;
    emailForApplications?: string;
    region: string;
    district: string;
    location: string;
    requirements: string[]; 
    benefits?: string[];     
    applicationDeadline?: string | Date; 
    jobImage?: PickerImage | null; 
}

export const useCreateJob = () => {
    const queryClient = useQueryClient();

    const createJobMutation = useMutation({
        mutationFn: async (data: CreateJobVariables) => {
            const formData = new FormData();

            formData.append("companyName", data.companyName);
            formData.append("title", data.title);
            formData.append("description", data.description);
            formData.append("category", data.category);
            formData.append("jobType", data.jobType);
            formData.append("workMode", data.workMode);
            formData.append("region", data.region);
            formData.append("district", data.district);
            formData.append("location", data.location);

            
            if (data.minSalary) formData.append("minSalary", String(data.minSalary));
            if (data.maxSalary) formData.append("maxSalary", String(data.maxSalary));
            if (data.currency) formData.append("currency", data.currency);
            if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
            if (data.emailForApplications) formData.append("emailForApplications", data.emailForApplications);
            
            if (data.applicationDeadline) {
                const dateStr = data.applicationDeadline instanceof Date 
                    ? data.applicationDeadline.toISOString() 
                    : data.applicationDeadline;
                formData.append("applicationDeadline", dateStr);
            }

            
            if (data.requirements) {
                formData.append("requirements", JSON.stringify(data.requirements));
            }
            if (data.benefits) {
                formData.append("benefits", JSON.stringify(data.benefits));
            }

            
            if (data.jobImage) {
                const fileType = data.jobImage.type || "image/jpeg";
                const fileName = data.jobImage.name || `job_banner_${Date.now()}.jpg`;

                formData.append("image", {
                    uri: data.jobImage.uri,
                    type: fileType,
                    name: fileName,
                } as any); 
            }

            
            const response = await api.post("/jobs", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            
            return response.data;
        },
        onSuccess: () => {
            
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            queryClient.invalidateQueries({ queryKey: ["jobs", "my-posted-jobs"] });
        },
    });

    return {
        createJobAsync: createJobMutation.mutateAsync,
        isCreatingJob: createJobMutation.isPending,
        isErrorCreatingJob: createJobMutation.isError,
        errorCreatingJob: createJobMutation.error,
    };
};
