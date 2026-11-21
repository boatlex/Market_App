import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { JobSeekerProfile } from "../types";

interface SearchCandidateResponse {
  success: boolean;
  resultsCount: number;
  totalPages: number;
  currentPage: number;
  profiles: JobSeekerProfile[];
}

export const useGetRelatedJobSeekers = (region?: string) => {
  return useQuery<JobSeekerProfile[], Error>({
    queryKey: ["related-job-seekers", region],
    queryFn: async () => {
      const { data } = await api.get<SearchCandidateResponse>(
        "/jobseekerprofiles/search", // Match your exact searchCandidatePool route
        {
          params: {
            region: region || undefined,
            limit: 10,
          },
        }
      );
      return data.profiles || [];
    },
    enabled: Boolean(region),
    staleTime: 1000 * 60 * 3,
  });
};
