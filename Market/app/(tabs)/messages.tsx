import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConversations, ActiveConversation } from '../../hooks/useConversations';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';
import { capitalizeFirstLetter, formatDate } from '../../lib/utils';

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const isAdmin = user?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { conversations = [], isLoading, refetch } = useConversations();
  const { isUserOnline } = useOnlineUsers();

  const handleBack = () => {
    const canGoBack =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
        : router.canGoBack();

    if (canGoBack) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

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
    const targetUserId = item?.user?._id;
    const online = isUserOnline(targetUserId);

    return (
      <View className="w-full max-w-2xl self-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (targetUserId) {
              router.push({
                pathname: '/chat' as any,
                params: { userId: String(targetUserId) },
              });
            }
          }}
          className="flex-row items-center justify-between py-3.5 px-4 bg-white border-b border-gray-100 md:mx-4 md:first:mt-3 md:rounded-2xl md:border md:mb-2 active:bg-gray-50"
        >
          {/* Left Layer: Tappable User Avatar (Opens Public Profile) + Online Dot */}
          <View className="flex-row items-center flex-1 mr-3">
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={(e) => {
                e.stopPropagation();
                if (targetUserId) {
                  router.push({
                    pathname: '/user/[id]',
                    params: { id: String(targetUserId) },
                  });
                }
              }}
              className="relative mr-3 shrink-0"
            >
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
            </TouchableOpacity>

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
          <View className="items-end justify-center shrink-0">
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
      </View>
    );
  };

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        Platform.OS === 'web' ? { height: '100vh' as any } : undefined,
      ]}
      className="bg-white md:bg-gray-50 overflow-hidden"
    >
      {/* Header with Back Arrow & ProfileMenuDrawer Toggle */}
      <View className="w-full bg-white border-b border-gray-100">
        <View className="w-full max-w-2xl self-center px-4 pt-4 pb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 pr-3">
              <TouchableOpacity
                onPress={handleBack}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="mr-3 p-1"
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>

              <Text className="text-2xl font-bold text-gray-900 mr-2.5">Chats</Text>

              {totalUnread > 0 && (
                <View className="bg-blue-50 px-2.5 py-1 rounded-full">
                  <Text className="text-xs font-bold text-blue-600">{totalUnread} unread</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              activeOpacity={0.75}
              style={{ width: 42, height: 42 }}
              className="bg-gray-900 rounded-xl items-center justify-center relative shrink-0"
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
              )}
            </TouchableOpacity>
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
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          className="flex-1 w-full"
          data={filteredConversations}
          keyExtractor={(item, index) => item?._id || item?.user?._id || String(index)}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: Platform.OS === 'web' ? 12 : 0,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={            <View className="w-full max-w-2xl self-center flex-1 items-center justify-center pt-20 px-6">
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

      {/* Column Slide-Out Menu Drawer */}
      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        side="right"
      />
    </View>
  );
}
