import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { useAuth } from '../contexts/authContext';

interface DeleteAccountResponse {
  status: 'success' | 'fail';
  message: string;
}

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const router = useRouter();

  const mutation = useMutation<DeleteAccountResponse, Error>({
    mutationFn: async () => {
      const { data } = await api.delete<DeleteAccountResponse>(
        '/users/delete-account'
      );
      return data;
    },
    onSuccess: async () => {
      // 1. Wipe all cached queries (user, products, jobs, job seeker profile, etc.)
      queryClient.clear();

      // 2. Clear AsyncStorage session & AuthContext state
      await logout();

      // 3. Redirect to auth/login screen
      router.replace('/(auth)' as any);
    },
  });

  // Optional one-line helper with built-in destructive confirmation dialog
  const confirmAndDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently',
      'This will permanently erase your account, products, services, jobs, job seeker profile, and uploaded files. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await mutation.mutateAsync();
            } catch (error: any) {
              Alert.alert(
                'Deletion Failed',
                error?.response?.data?.message ||
                  error?.message ||
                  'Could not delete your account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return {
    deleteAccount: mutation.mutate,
    deleteAccountAsync: mutation.mutateAsync,
    confirmAndDeleteAccount,
    isDeletingAccount: mutation.isPending,
    deleteAccountError: mutation.error,
  };
};
