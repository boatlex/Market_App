import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
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
  const { height: screenHeight } = useWindowDimensions();

  const {
    notifications,
    isLoading,
    isError,
    refetch,
    hasUnread,
    isRefetching,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications();

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
        params: { sellerID: item.recipientId },
      });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const iconMeta = getNotificationIcon(item.itemDetails);
    const senderUser = (item as any).senderId as User | undefined;

    const senderName = senderUser?.firstName
      ? `${senderUser.firstName} ${senderUser.lastName || ''}`.trim()
      : 'Someone';

    const displayMessage = `${senderName} ${item.itemDetails}`;

    return (
      <View className="w-full max-w-2xl self-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleNotificationPress(item)}
          className={`flex-row items-start p-4 border-b border-gray-100 md:mx-4 md:first:mt-3 md:rounded-2xl ${item.isRead ? 'bg-white' : 'bg-blue-50/40'
            }`}
        >
          {/* Dynamic Activity Icon or User Profile Circle */}
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-3.5 overflow-hidden shrink-0 ${iconMeta.bg}`}
          >
            {senderUser?.profilePicture ? (
              <Image
                source={{ uri: senderUser.profilePicture }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Ionicons name={iconMeta.name} size={20} color={iconMeta.color} />
            )}
          </View>

          {/* Text Details Area */}
          <View className="flex-1 mr-2">
            <Text
              className={`text-sm text-gray-800 leading-5 ${!item.isRead ? 'font-semibold' : 'font-normal'
                }`}
            >
              {displayMessage}
            </Text>
            {Boolean(item.createdAt) && (
              <Text className="text-xs text-gray-400 mt-1">
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}
          </View>

          {/* Unread Status Marker Dot */}
          {!item.isRead && (
            <View className="w-2.5 h-2.5 rounded-full bg-blue-500 self-center ml-1 shrink-0" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeScreen>
      <View
        className="flex-1 bg-white md:bg-gray-50 overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
      >
        {/* Structural Nav Bar Header */}
        <Header title="Notifications" fallbackRoute="/(profile)/settings" />

        {/* "Mark all as read" Toolbar Trigger */}
        {hasUnread && (
          <View className="w-full bg-gray-50 border-b border-gray-100">
            <View className="w-full max-w-2xl self-center px-4 py-2.5 flex-row justify-end items-center">
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
          <View className="w-full max-w-2xl self-center flex-1 justify-center items-center p-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-sm font-semibold text-gray-700 mt-3 text-center">
              Could not load notifications
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 bg-blue-600 px-5 py-2.5 rounded-xl"
            >
              <Text className="text-white text-xs font-bold">Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Core Notifications List Feed (Full-width FlatList keeps scrollbar on right edge) */}
        {!isLoading && !isError && (
          <FlatList
            className="flex-1 w-full"
            style={
              Platform.OS === 'web'
                ? { height: screenHeight - 110, maxHeight: screenHeight - 110 }
                : { flex: 1 }
            }
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching && !isLoading}
                onRefresh={refetch}
                tintColor="#2563EB" // iOS spinner color
                colors={['#2563EB']} // Android spinner color
              />
            }
            contentContainerStyle={{
              paddingTop: Platform.OS === 'web' ? 12 : 0,
              paddingBottom: Platform.OS === 'ios' ? 40 : 40,
            }}
            ListEmptyComponent={
              <View className="w-full max-w-2xl self-center flex-1 items-center justify-center pt-24 px-6">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Ionicons name="notifications-off-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-sm font-medium text-gray-500 text-center">
                  All caught up! You don't have any notifications right now.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeScreen>
  );
};

export default NotificationsScreen;
