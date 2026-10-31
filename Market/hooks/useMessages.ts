import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api'; 
import { Message } from '../types';

interface MessagesResponse {
  success: boolean;
  messages: Message[];
}

interface SendMessageResponse {
  success: boolean;
  message: Message;
}

export const useMessages = (userToChatId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['messages', userToChatId];

  // 1. Fetch conversation history with a specific user
  const { data: messages, isLoading, isError, refetch } = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<MessagesResponse>(`/messages/${userToChatId}`);
      return data.messages;
    },
    enabled: !!userToChatId, // Only fetch if we have a valid user ID selected
  });

  // 2. Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { content?: string; attachment?: string }) => {
      const { data } = await api.post<SendMessageResponse>(
        `/messages/send/${userToChatId}`, 
        payload
      );
      return data.message;
    },
    onSuccess: (newMessage) => {
      // Optimistic cache update: Append the user's sent message immediately to the feed
      queryClient.setQueryData<Message[]>(queryKey, (oldMessages) => {
        if (!oldMessages) return [newMessage];
        return [...oldMessages, newMessage];
      });
    },
  });

  return {
    messages: messages || [],
    isLoading,
    isError,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};
