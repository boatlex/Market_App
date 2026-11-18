import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { User } from '../types';
import { useAuth } from '../contexts/authContext';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  profilePictureUri?: string | null; 
}

interface UpdateProfileResponse {
  status: 'success' | 'fail';
  data: User;
  message: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  const mutation = useMutation<UpdateProfileResponse, Error, UpdateProfilePayload>({
    mutationFn: async ({ firstName, lastName, profilePictureUri }) => {
      const formData = new FormData();

      if (firstName !== undefined) {
        formData.append('firstName', firstName);
      }
      if (lastName !== undefined) {
        formData.append('lastName', lastName);
      }

      // Only append file if user picked a new local image (not an existing https:// URL)
      if (profilePictureUri && !profilePictureUri.startsWith('http')) {
        const filename = profilePictureUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('profilePicture', {
          uri: profilePictureUri,
          name: filename,
          type,
        } as any);
      }

      const { data } = await api.patch<UpdateProfileResponse>(
        '/users/update-profile',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      return data;
    },
    onSuccess: async (response) => {
      if (response.data) {
        await updateUser(response.data);
        queryClient.setQueryData(['current-user'], response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  return {
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    isUpdatingProfile: mutation.isPending,
    isUpdateSuccess: mutation.isSuccess,
    updateError: mutation.error,
    resetUpdateState: mutation.reset,
  };
};
