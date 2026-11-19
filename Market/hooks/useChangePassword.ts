import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '../lib/api';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
}

export const useChangePassword = () => {
  const mutation = useMutation<
    ChangePasswordResponse,
    AxiosError<ApiErrorResponse>,
    ChangePasswordPayload
  >({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const { data } = await api.patch<ChangePasswordResponse>(
        '/auths/change-password',
        payload
      );
      return data;
    },
  });

  return {
    changePassword: mutation.mutate,
    changePasswordAsync: mutation.mutateAsync,
    isChangingPassword: mutation.isPending,
    isPasswordChanged: mutation.isSuccess,
    changePasswordError:
      mutation.error?.response?.data?.message || mutation.error?.message || null,
    resetChangePasswordState: mutation.reset,
  };
};
