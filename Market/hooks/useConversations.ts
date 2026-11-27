import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getSocket } from '../sockets/sockets';

export interface ActiveConversation {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export const useConversations = () => {
  const queryClient = useQueryClient();
  const socketInstance = getSocket();
  const socket = socketInstance?.socket || socketInstance;

  const { data, isLoading, isError, refetch } = useQuery<ActiveConversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations');
      return data.conversations || [];
    },
  });

  useEffect(() => {
    if (!socket) return;

    const refreshInbox = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('newMessage', refreshInbox);
    socket.on('messageDeleted', refreshInbox);

    return () => {
      socket.off('newMessage', refreshInbox);
      socket.off('messageDeleted', refreshInbox);
    };
  }, [socket, queryClient]);

  return {
    conversations: data || [],
    isLoading,
    isError,
    refetch,
  };
};
