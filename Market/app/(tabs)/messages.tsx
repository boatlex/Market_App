import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConversations, ActiveConversation } from '../../hooks/useConversations';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { capitalizeFirstLetter, formatDate } from '../../lib/utils';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { conversations = [], isLoading, refetch } = useConversations();
  const { isUserOnline } = useOnlineUsers();

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((item) => {
      const fullName = `${item?.user?.firstName || ''} ${item?.user?.lastName || ''}`.toLowerCase();
      const lastMsg = (item?.lastMessage?.content || '').toLowerCase();
      return fullName.includes(query) || lastMsg.includes(query);
    });
  }, [conversations, searchQuery]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, item) => sum + (item?.unreadCount ?? 0), 0),
    [conversations]
  );

  const renderChatItem = ({ item }: { item: ActiveConversation }) => {
    const firstName = item?.user?.firstName || '';
    const lastName = item?.user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';
    const fallbackChar = firstName ? firstName.charAt(0) : lastName ? lastName.charAt(0) : 'U';
    const unreadCount = item?.unreadCount ?? 0;
    const online = isUserOnline(item?.user?._id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (item?.user?._id) {
            router.push({
              pathname: '/chat' as any,
              params: { userId: String(item.user._id) },
            });
          }
        }}
        className="flex-row items-center justify-between py-3.5 px-4 border-b border-gray-100 active:bg-gray-50"
      >
        {/* Left Layer: User Avatar + Online Dot */}
        <View className="flex-row items-center flex-1 mr-3">
          <View className="relative mr-3">
            <View className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
              {item?.user?.profilePicture ? (
                <Image source={{ uri: item.user.profilePicture }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-blue-100">
                  <Text className="text-blue-600 font-bold text-base">
                    {capitalizeFirstLetter(fallbackChar)}
                  </Text>
                </View>
              )}
            </View>

            {/* Green Online Status Indicator */}
            {online && (
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
            )}
          </View>

          {/* Middle Layer: Name, Status & Last Message */}
          <View className="flex-1 justify-center">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                {fullName}
              </Text>
              {online && (
                <Text className="text-[10px] font-semibold text-green-600">• Online</Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              className={`text-xs ${
                unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              {item?.lastMessage?.content || 'No messages yet'}
            </Text>
          </View>
        </View>

        {/* Right Layer: Timestamp & Unread Badge */}
        <View className="items-end justify-center">
          <Text
            className={`text-[10px] mb-1 ${
              unreadCount > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'
            }`}
          >
            {item?.lastMessage?.createdAt ? formatDate(item.lastMessage.createdAt) : ''}
          </Text>
          {unreadCount > 0 && (
            <View className="bg-blue-600 rounded-full h-5 min-w-[20px] px-1.5 items-center justify-center">
              <Text className="text-[10px] text-white font-bold">{unreadCount}</Text>
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
        paddingRight: insets.right,
      }}
      className="bg-white"
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">Chats</Text>
          {totalUnread > 0 && (
            <View className="bg-blue-50 px-2.5 py-1 rounded-full">
              <Text className="text-xs font-bold text-blue-600">{totalUnread} unread</Text>
            </View>
          )}
        </View>

        {/* Search Input */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3.5 py-2">
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            className="flex-1 ml-2 text-sm text-gray-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item, index) => item?._id || item?.user?._id || String(index)}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, flexGrow: 1 }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-6">
              <Ionicons name="chatbubbles-outline" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-400 font-medium mt-2 text-center">
                {searchQuery
                  ? `No conversations matching "${searchQuery}"`
                  : 'No active conversations yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
