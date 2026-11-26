import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Message } from '../types';

export type { Message };

interface MessagesResponse {
  success: boolean;
  messages: Message[];
}

interface SendMessageResponse {
  success: boolean;
  message: Message;
}

export interface SendMessagePayload {
  type: 'text' | 'image' | 'voice';
  content?: string;
  fileUri?: string;
  fileName?: string;
  fileType?: string;
  duration?: number;
}

export const useMessages = (userToChatId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['messages', userToChatId];

  const isValidTarget = Boolean(userToChatId) && userToChatId !== 'undefined';

  // 1. Fetch Conversations History
  const { data: messages, isLoading, isError, refetch } = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<MessagesResponse>(`/messages/${userToChatId}`);
      return data.messages || [];
    },
    enabled: isValidTarget,
  });

  // 2. Multi-Format Messaging Dispatch Mutation Layer
  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      if (!isValidTarget) {
        throw new Error('Recipient user ID is missing.');
      }

      if (payload.type === 'image' || payload.type === 'voice') {
        const formData = new FormData();
        formData.append('messageType', payload.type);

        if (payload.content) {
          formData.append('content', payload.content);
        }

        if (payload.duration) {
          formData.append('voiceDuration', String(payload.duration));
        }

        if (payload.fileUri) {
          const fallbackName =
            payload.fileName || (payload.type === 'image' ? 'photo.jpg' : 'audio.m4a');
          const fallbackType =
            payload.fileType || (payload.type === 'image' ? 'image/jpeg' : 'audio/m4a');

          if (Platform.OS === 'web') {
            // Convert blob:/data: URI into a real Blob so Multer parses req.file on web
            const fileResponse = await fetch(payload.fileUri);
            const fileBlob = await fileResponse.blob();
            formData.append('attachment', fileBlob, fallbackName);
          } else {
            formData.append('attachment', {
              uri: payload.fileUri,
              name: fallbackName,
              type: fallbackType,
            } as any);
          }
        }

        const { data } = await api.post<SendMessageResponse>(
          `/messages/send/${userToChatId}`,
          formData,
          Platform.OS === 'web'
            ? undefined
            : {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
        );
        return data.message;
      }

      const { data } = await api.post<SendMessageResponse>(
        `/messages/send/${userToChatId}`,
        {
          content: payload.content,
          messageType: 'text',
        }
      );
      return data.message;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>(queryKey, (oldMessages) => {
        if (!oldMessages) return [newMessage];
        return [...oldMessages, newMessage];
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      console.error('Send message failed:', error?.response?.data || error?.message);
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
