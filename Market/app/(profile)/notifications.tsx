import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import React from 'react';
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import useNotifications from '../../hooks/useNotifications'; 
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Notification, User } from '../../types';
import { useRouter } from 'expo-router'; 

const NotificationsScreen = () => {
  const router = useRouter(); 
  const { 
    notifications, 
    isLoading, 
    isError, 
    refetch, 
    hasUnread, 
    markAsRead, 
    markAllAsRead, 
    isMarkingAllAsRead 
  } = useNotifications();

  // Helper function to return beautiful custom icons based on notification triggers
  const getNotificationIcon = (details: string = '') => {
    const text = details.toLowerCase();
    if (text.includes('offer') || text.includes('deal')) {
      return { name: 'cash-outline' as const, color: '#16A34A', bg: 'bg-green-50' };
    }
    if (text.includes('callback') || text.includes('contact') || text.includes('call me back')) {
      return { name: 'call-outline' as const, color: '#2563EB', bg: 'bg-blue-50' };
    }
    if (text.includes('comment') || text.includes('reply') || text.includes('liked your comment')) {
      return { name: 'chatbubble-outline' as const, color: '#9333EA', bg: 'bg-purple-50' };
    }
    return { name: 'notifications-outline' as const, color: '#4B5563', bg: 'bg-gray-50' };
  };

  const handleNotificationPress = (item: Notification) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    const targetProductId = (item as any).productId;

   if (targetProductId) {
  router.push({
    pathname: `/product/${targetProductId}` as any, 
    params: { sellerID: item.recipientId } 
  });
}

  };

  const renderItem = ({ item }: { item: Notification }) => {
    const iconMeta = getNotificationIcon(item.itemDetails);
    
    // 👤 Extract the populated sender user object safely
    const senderUser = (item as any).senderId as User | undefined;
    
    // Format display string if senderUser object fields are explicitly populated
    const senderName = senderUser?.firstName 
      ? `${senderUser.firstName} ${senderUser.lastName || ''}`.trim() 
      : 'Someone';

    const displayMessage = `${senderName} ${item.itemDetails}`;
        
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)} 
        className={`flex-row items-start p-4 border-b border-gray-100 ${item.isRead ? 'bg-white' : 'bg-blue-50/30'}`}
      >
        {/* Dynamic Activity Icon or User Profile Circle Layout */}
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3.5 overflow-hidden ${iconMeta.bg}`}>
          {senderUser?.profilePicture ? (
            <Image 
              source={{ uri: senderUser.profilePicture }} 
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <Ionicons name={iconMeta.name} size={20} color={iconMeta.color} />
          )}
        </View>

        {/* Text Details Area */}
        <View className="flex-1 mr-2">
          <Text className={`text-sm text-gray-800 leading-5 ${!item.isRead ? 'font-semibold' : 'font-normal'}`}>
            {displayMessage}
          </Text>
          {item.createdAt && (
            <Text className="text-xs text-gray-400 mt-1">
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>

        {/* Unread Status Marker Dot */}
        {!item.isRead && (
          <View className="w-2.5 h-2.5 rounded-full bg-blue-500 self-center ml-1" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreen>
      {/* Structural Nav Bar Header */}
      <Header title='Notifications' />

      {/* "Mark all as read" Toolbar Trigger */}
      {hasUnread && (
        <View className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-row justify-end items-center">
          <TouchableOpacity 
            onPress={() => markAllAsRead()} 
            disabled={isMarkingAllAsRead}
            className="flex-row items-center gap-1.5"
          >
            {isMarkingAllAsRead ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={16} color="#2563EB" />
                <Text className="text-xs font-bold text-blue-600">Mark all as read</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Screen Loading Handle */}
      {isLoading && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {/* Screen Error Handle */}
      {isError && (
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-sm font-semibold text-gray-700 mt-3 text-center">
            Could not load notifications
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-blue-600 px-5 py-2.5 rounded-xl">
            <Text className="text-white text-xs font-bold">Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Core Notifications List Feed */}
      {!isLoading && !isError && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 px-6">
              <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-4">
                <Ionicons name="notifications-off-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-sm font-medium text-gray-500 text-center">
                All caught up! You don't have any notifications right now.
              </Text>
            </View>
          }
        />
      )}
    </SafeScreen>
  );
};

export default NotificationsScreen;
