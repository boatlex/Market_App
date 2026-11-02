import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { User, Message } from '../types'; // 👈 Import your actual global entities

// 1. Extend the native server type to represent what the controller formats
export interface ActiveConversation {
  _id: string;
  unreadCount?: number;
  lastMessage: Pick<Message, 'content' | 'senderId' | 'createdAt'> | null;
  user: Pick<User, '_id' | 'firstName' | 'lastName' | 'profilePicture'>;
}

interface ConversationsResponse {
  success: boolean;
  conversations: ActiveConversation[];
}

export const useConversations = () => {
  const { data: conversations, isLoading, isError, refetch } = useQuery<ActiveConversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get<ConversationsResponse>('/messages/conversations');
      return data.conversations;
    },
  });

  return {
    conversations: conversations || [],
    isLoading,
    isError,
    refetch,
  };
};
