import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Notification } from '../types';

interface NotificationsResponse {
  message: string;
  notifications: Notification[];
}

const useNotifications = () => {
  const queryClient = useQueryClient();

  // 1. Fetch All Notifications
  const { data: notifications, isLoading, isError, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>('/notifications');
      return data.notifications;
    },
  });

  // 2. Mark Single Notification as Read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.patch<NotificationsResponse>(`/notifications/mark-one/${notificationId}`);
      return data.notifications;
    },
    onSuccess: (updatedNotifications) => {
      // Direct cache update with the fresh list returned from the server
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
