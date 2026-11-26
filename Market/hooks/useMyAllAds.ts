import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useMyAllAds = () => {
  const queryClient = useQueryClient();
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  const {
    data: ads = [],
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['my-all-ads'],
    queryFn: async () => {
      const { data } = await api.get('/users/my-listings');
      return data.listings || [];
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (item: any) => {
      const id = typeof item === 'string' ? item : item._id;
      setDeletingAdId(id);

      const isJobPosting =
        typeof item === 'object' && !!item.employer && 'isOpen' in item;
      const isSeekingJob =
        typeof item === 'object' &&
        ('seekerId' in item || item.listingType === 'seeking_job');
      const isService =
        typeof item === 'object' &&
        (item.category === 'Services' || item.listingType === 'service');

      if (isJobPosting) {
        await api.delete(`/jobs/${id}`);
      } else if (isSeekingJob) {
        await api.delete(`/job-seekers/${id}`);
      } else if (isService) {
        await api.delete(`/services/${id}`);
      } else {
        await api.delete(`/products/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-all-ads'] });
    },
    onSettled: () => {
      setDeletingAdId(null);
    },
  });

  return {
    ads,
    isLoading,
    isRefetching,
    isError,
    refetch,
    deleteAd: deleteAdMutation.mutate,
    deletingAdId,
  };
};

export default useMyAllAds;
