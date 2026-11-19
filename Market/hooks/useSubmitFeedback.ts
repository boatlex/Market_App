import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '../lib/api';
import { FeedbackCategory, FeedbackItem, ReviewRating } from '../types';
export type { FeedbackCategory, FeedbackItem, ReviewRating };
export interface SubmitFeedbackPayload {
  category: FeedbackCategory;
  rating: ReviewRating;
  subject: string;
  message: string;
}

interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  feedback?: FeedbackItem;
}

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    SubmitFeedbackResponse,
    AxiosError<{ message?: string }>,
    SubmitFeedbackPayload
  >({
    mutationFn: async (payload: SubmitFeedbackPayload) => {
      const { data } = await api.post<SubmitFeedbackResponse>('/feedback', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });

  return {
    submitFeedback: mutation.mutate,
    submitFeedbackAsync: mutation.mutateAsync,
    isSubmittingFeedback: mutation.isPending,
    isFeedbackSubmitted: mutation.isSuccess,
    feedbackError:
      mutation.error?.response?.data?.message || mutation.error?.message || null,
    resetFeedbackState: mutation.reset,
  };
};
