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

// Clear payload typing defining parameter options supported by your messaging UI components
interface SendMessagePayload {
  content?: string;
  type: 'text' | 'image' | 'voice';
  fileUri?: string;
  fileName?: string;
  fileType?: string;
  duration?: number;
}

export const useMessages = (userToChatId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['messages', userToChatId];

  // 1. Fetch Conversations History
  const { data: messages, isLoading, isError, refetch } = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<MessagesResponse>(`/messages/${userToChatId}`);
      return data.messages;
    },
    enabled: !!userToChatId,
  });

  // 2. Multi-Format Messaging Dispatch Mutation Layer
  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      // ⚡ CHECK: Formulate a multi-part streams payload handler if an asset attachment exists
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
          // Standard structural formatting mapping for native multipart file boundaries parsing
          formData.append('attachment', {
            uri: payload.fileUri,
            name: payload.fileName || (payload.type === 'image' ? 'photo.jpg' : 'audio.m4a'),
            type: payload.fileType || (payload.type === 'image' ? 'image/jpeg' : 'audio/m4a'),
          } as any);
        }

        const { data } = await api.post<SendMessageResponse>(
          `/messages/send/${userToChatId}`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data', // ⚡ Explicitly sets boundaries frame rule
            },
          }
        );
        return data.message;
      }

      const { data } = await api.post<SendMessageResponse>(
        `/messages/send/${userToChatId}`,
        {
          content: payload.content,
          messageType: 'text'
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
