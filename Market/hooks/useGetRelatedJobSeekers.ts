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

interface RelatedJobSeekersFilters {
  region?: string;
  category?: string;
  seekJobType?: string;
}

export const useGetRelatedJobSeekers = ({
  region,
  category,
  seekJobType,
}: RelatedJobSeekersFilters = {}) => {
  return useQuery<JobSeekerProfile[], Error>({
    queryKey: ["related-job-seekers", { region, category, seekJobType }],
    queryFn: async () => {
      const { data } = await api.get<SearchCandidateResponse>(
        "/jobseekerprofiles/search",
        {
          params: {
            region: region || undefined,
            category: category || undefined,
            seekJobType: seekJobType || undefined,
            limit: 10,
          },
        }
      );
      return data.profiles || [];
    },
    enabled: Boolean(region || category || seekJobType),
    staleTime: 1000 * 60 * 3,
  });
};
