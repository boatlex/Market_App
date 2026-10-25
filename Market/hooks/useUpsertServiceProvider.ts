import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ServiceProvider, PricingBasis, AvailabilityStatus } from "../types";

export interface FormDataFile {
    uri: string;
    name: string;
    type: string;
}

export interface UpsertServiceProviderVariables {
    businessName: string;
    category: string; 
    serviceType: string; 
    description: string;
    rate: number | string;
    basis: PricingBasis;
    currency?: string;
    phoneNumber: string;
    whatsappNumber?: string;
    region: string;
    district: string;
    location: string;
    availabilityStatus?: AvailabilityStatus;
    portfolioImageFiles?: FormDataFile[] | null;
}

interface UpsertServiceProviderResponse {
    success: boolean;
    message: string;
    profile: ServiceProvider;
}

export const useUpsertServiceProvider = () => {
    const queryClient = useQueryClient();

    return useMutation<UpsertServiceProviderResponse, Error, UpsertServiceProviderVariables>({
        mutationFn: async (variables) => {
            const formData = new FormData();

            // Text primitives structural mappings
            formData.append("businessName", variables.businessName);
            formData.append("category", variables.category); 
            formData.append("serviceType", variables.serviceType);
            formData.append("description", variables.description);
            formData.append("rate", String(variables.rate));
            formData.append("basis", variables.basis);
            formData.append("currency", variables.currency || "GHS");
            formData.append("phoneNumber", variables.phoneNumber);
            
            if (variables.whatsappNumber) formData.append("whatsappNumber", variables.whatsappNumber);
            formData.append("region", variables.region);
            formData.append("district", variables.district);
            formData.append("location", variables.location);
            formData.append("availabilityStatus", variables.availabilityStatus || "Available");

            // Multi-file trade portfolio images serialization block
            if (variables.portfolioImageFiles && variables.portfolioImageFiles.length > 0) {
                variables.portfolioImageFiles.forEach((file) => {
                    formData.append("portfolioImages", file as any);
                });
            }

            const response = await api.put<UpsertServiceProviderResponse>(
                "/serviceproviders/profile", 
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
            queryClient.setQueryData(["my-provider-profile"], { 
                success: true, 
                isNewProvider: false, 
                profile: data.profile 
            });
            queryClient.invalidateQueries({ queryKey: ["search-service-providers"] });
        },
    });
};
