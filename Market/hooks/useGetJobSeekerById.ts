import { api } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { JobSeekerProfile } from '../types'

export const useGetJobSeekerById = (profileId: string) => {
    console.log("1. Hook received profileId:", profileId);

    return useQuery<JobSeekerProfile>({
        queryKey: ["force-fresh-jobseeker-profile", profileId],
        
        queryFn: async () => {
            
            try {
                const response = await api.get(`/jobseekerprofiles/${profileId}`); 
                return response.data.data;
            } catch (networkError) {
                console.error("AXIOS NETWORK ERROR DETAILS:", networkError);
                throw networkError;
            }
        },
        
    

        enabled: typeof profileId === 'string' && profileId.length > 5 && profileId !== '[id]',
        
        retry: false,
        staleTime: 0,
    });
};
