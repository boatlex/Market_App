import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ServiceProvider } from "../types";

interface GetMyProviderProfileResponse {
    success?: boolean;
    message?: string;
    isNewProvider: boolean;
    profile: ServiceProvider | null;
}

export const useGetMyProviderProfile = () => {
    return useQuery<GetMyProviderProfileResponse, Error>({
        queryKey: ["my-provider-profile"],
        queryFn: async () => {
            const response = await api.get<GetMyProviderProfileResponse>("/serviceproviders/my-profile");
            return response.data;
        },
    });
};
