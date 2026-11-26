import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { User, Product, ServiceProvider, Job } from "../types";

export interface PublicUserProfileResponse {
  status: string;
  data: {
    user: User;
    products: Product[];
    services: ServiceProvider[];
    jobs: Job[];
    jobSeekerProfile: any | null;
  };
}

export const usePublicUserProfile = (userId?: string) => {
  return useQuery<PublicUserProfileResponse["data"]>({
    queryKey: ["public-user-profile", userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/public-profile`);
      return response.data.data;
    },
    enabled: Boolean(userId),
  });
};

export default usePublicUserProfile;
