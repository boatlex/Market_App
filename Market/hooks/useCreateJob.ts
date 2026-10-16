import { api } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface PickerImage {
    uri: string;
    isRemote?: boolean;
    type?: string;
    name?: string;
}

export interface CreateJobVariables {
    companyName: string;
    title: string;
    description: string;
    category: string;
    jobType: string;
    workMode: string;
    salary: {
        currency: string;
        min: number;
        max: number;
        period: string;
    };
    phoneNumber?: string;
    emailForApplications?: string;
    region: string;
    district: string;
    location: string;
    requirements: string[];
    benefits: string[];
    applicationDeadline?: string;
    jobImage: PickerImage;
}


export const useCreateJob = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (variables: CreateJobVariables) => {
            const formData = new FormData();

            if (variables.jobImage && variables.jobImage.uri) {
                const localFile = variables.jobImage; 

                formData.append("image", {
                    uri: localFile.uri,
                    type: localFile.type || "image/jpeg",
                    name: localFile.name || `new_job_banner_${Date.now()}.jpg`
                } as any);
            }

            formData.append("companyName", variables.companyName);
            formData.append("title", variables.title);
            formData.append("description", variables.description);
            formData.append("category", variables.category);
            formData.append("jobType", variables.jobType);
            formData.append("workMode", variables.workMode);

            formData.append("salaryMin", String(variables.salary.min));
            formData.append("salaryMax", String(variables.salary.max));
            formData.append("currency", variables.salary.currency || "GHS");
            formData.append("salaryPeriod", variables.salary.period || "monthly");

            if (variables.phoneNumber) formData.append("phoneNumber", variables.phoneNumber);
            if (variables.emailForApplications) formData.append("emailForApplications", variables.emailForApplications);

            formData.append("region", variables.region);
            formData.append("district", variables.district);
            formData.append("location", variables.location);

            formData.append("requirements", JSON.stringify(variables.requirements));
            formData.append("benefits", JSON.stringify(variables.benefits));

            if (variables.applicationDeadline) {
                formData.append("applicationDeadline", variables.applicationDeadline);
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
        }
    });

    return {
        createJobAsync: mutation.mutateAsync,
        isCreatingJob: mutation.isPending,
        isErrorCreatingJob: mutation.isError,
        error: mutation.error
    };
};
