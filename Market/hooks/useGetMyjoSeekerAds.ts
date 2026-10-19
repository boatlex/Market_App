import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api"; 
import { JobSeekerProfile } from "../types"; 

interface MyAdsResponse {
    success: boolean;
    resultsCount: number;
    profile: JobSeekerProfile[];
}

const fetchMyAds = async (): Promise<JobSeekerProfile[]> => {
  
    const { data } = await api.get<MyAdsResponse>("/jobseekerprofiles/jobseeker/my-ads");
    console.log("🔥 Raw Backend Response Profiles Data:", data.profile);
    return data.profile;
};


export const useGetMyJobSeekerAds = () => {
    return useQuery<JobSeekerProfile[], Error>({
        queryKey: ["my-job-seeking-ads"],
        queryFn: fetchMyAds,
        staleTime: 1000 * 60 * 3, 
    });
}
