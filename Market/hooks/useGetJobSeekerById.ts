import { api } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { JobSeekerProfile } from '../types'

export const useGetJobSeekerById = (profileId: string ) => {
    const results = useQuery<JobSeekerProfile>({
        queryKey: ["jobseeker-profile-by-id", profileId || 'skip'],
        queryFn: async () => {
            if (!profileId || profileId === '[id]') {
                throw new Error("A valid profile ID path parameter is required");
            }
            
            const { data } = await api.get(`/jobseekerprofiles/${profileId}`);
            
            if (!data || data.data === undefined) {
                throw new Error("Profile data not found in server response");
            }
            
            return data.data;
        },
        
        enabled: !!profileId,
        retry: false,
        staleTime: 1000 * 60 * 5, 
    });

    return results;
};