import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { Notification } from '../types';
import { getSocket } from '../sockets/sockets'; 

interface NotificationsResponse {
  message: string;
  notifications: Notification[];
}

const useNotifications = () => {
  const queryClient = useQueryClient();
  const socket = getSocket(); 

  
  const { data: notifications, isLoading, isError, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>('/notifications');
      return data.notifications;
    },
  });

  // 📡 Real-Time Socket Notification Ingestion Layer
  useEffect(() => {
    if (!socket) return;

    // Listen for real-time notification dispatches emitted by the backend cluster
    const handleIncomingNotification = (newNotification: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (oldData) => {
        if (!oldData) return [newNotification];
        
        // Prevent duplicate appending if the socket events fire multiple times
        const exists = oldData.some((n) => n._id === newNotification._id);
        if (exists) return oldData;

        // Prepend the brand new item at the top of the array stack
        return [newNotification, ...oldData];
      });
    };

    socket.on('newNotification', handleIncomingNotification);

    // Clean up event listener when hook drops from view tree context scope
    return () => {
      socket.off('newNotification', handleIncomingNotification);
    };
  }, [socket, queryClient]);

  // 2. Mark Single Notification as Read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.patch<NotificationsResponse>(`/notifications/mark-one/${notificationId}`);
      return data.notifications;
    },
    onSuccess: (updatedNotifications) => {
      queryClient.setQueryData(['notifications'], updatedNotifications);
    },
  });

  // 3. Mark All Notifications as Read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<NotificationsResponse>('/notifications/mark-all');
      return data.notifications;
    },
    onSuccess: (updatedNotifications) => {
      queryClient.setQueryData(['notifications'], updatedNotifications);
    },
  });

  // Helpers
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const hasUnread = unreadCount > 0;

  return {
    notifications: notifications || [],
    isLoading,
    isError,
    refetch,
    unreadCount,
    hasUnread,
    
    // Mutations
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,

    // Loading & Operation flags
    isMarkingAsRead: markAsReadMutation.isPending 
      ? markAsReadMutation.variables 
      : null,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};

export default useNotifications;
