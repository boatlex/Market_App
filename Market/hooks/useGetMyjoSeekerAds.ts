import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api"; // Your custom configured Axios instance
import { JobSeekerProfile } from "../types"; 

interface MyAdsResponse {
    success: boolean;
    resultsCount: number;
    profiles: JobSeekerProfile[];
}

const fetchMyAds = async (): Promise<JobSeekerProfile[]> => {
  // FIXED: Corrected the endpoint URL path string to combine with your server.js prefix
    const { data } = await api.get<MyAdsResponse>("/jobseekerprofiles/jobseeker/my-ads");
    console.log("🔥 Raw Backend Response Profiles Data:", data.profiles);
    return data.profiles;
};


export const useGetMyJobSeekerAds = () => {
    return useQuery<JobSeekerProfile[], Error>({
        queryKey: ["my-job-seeking-ads"],
        queryFn: fetchMyAds,
        staleTime: 1000 * 60 * 3, 
    });
};
