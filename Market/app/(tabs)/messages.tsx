import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversations, ActiveConversation } from '../../hooks/useConversations';
import { capitalizeFirstLetter, formatDate } from '../../lib/utils';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { conversations, isLoading, refetch } = useConversations();

  const renderChatItem = ({ item }: { item: ActiveConversation }) => {
    const firstName = item?.user?.firstName || "";
    const lastName = item?.user?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';
    
    const fallbackChar = firstName ? firstName.charAt(0) : (lastName ? lastName.charAt(0) : 'U');

    return (
      <TouchableOpacity
        onPress={() => {
          if (item?.user?._id) {
            router.push({
              pathname: "/chat" as any,
              params: { userId: String(item.user._id) }
            });
          }
        }}
        className="flex-row items-center justify-between py-3 border border-blue-10 active:bg-blue-500"
      >
        {/* Left Layer: User Avatar */}
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
            {item?.user?.profilePicture ? (
              <Image source={{ uri: item.user.profilePicture }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full items-center justify-center bg-blue-100">
                <Text className="text-blue-600 font-semibold">
                  {/* FIXED: Uses a single letter initial instead of the full name string */}
                  {capitalizeFirstLetter(fallbackChar)}
                </Text>
              </View>
            )}
          </View>

          {/* Middle Layer: Details Layer */}
          <View className="flex-1 justify-center">
            <Text className="text-sm font-semibold text-gray-900 mb-0.5">{fullName}</Text>
            <Text
              numberOfLines={1}
              className={`text-xs ${(item?.unreadCount ?? 0) > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
            >
              {item?.lastMessage?.content || 'No messages yet'}
            </Text>
          </View>
        </View>

        {/* Right Layer: Badges & Timestamps */}
        <View className="items-end justify-center">
          <Text className={`text-[10px] mb-1 ${(item?.unreadCount ?? 0) > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            {item?.lastMessage?.createdAt ? formatDate(item.lastMessage.createdAt) : ''}
          </Text>
          {(item?.unreadCount ?? 0) > 0 && (
            <View className="bg-blue-600 rounded-full h-5 min-w-[20px] px-1 items-center justify-center">
              <Text className="text-[10px] text-white font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
      className="bg-white px-4"
    >
      <View className="py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Chats</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="text-sm text-gray-400 font-medium">No active conversations yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
