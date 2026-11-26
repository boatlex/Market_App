import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import useFollow from '../../hooks/useFollow';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';
import { User } from '../../types';

type ConnectionTab = 'followers' | 'following';

const FollowersScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { tab, userId: paramUserId } = useLocalSearchParams<{
    tab?: ConnectionTab;
    userId?: string;
  }>();

  const currentUserId = user?._id || user?.id;
  const targetProfileId = paramUserId || currentUserId;
  const isAdmin = user?.role === 'admin';

  const {
    followers,
    following,
    followersCount,
    followingCount,
    isLoading,
    isRefetching,
    isError,
    refetch,
    toggleFollow,
    togglingUserId,
    isFollowingUser,
  } = useFollow(targetProfileId);

  const [activeTab, setActiveTab] = useState<ConnectionTab>(
    tab === 'following' ? 'following' : 'followers'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeList = activeTab === 'followers' ? followers : following;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeList;

    return activeList.filter((item) => {
      const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
      const email = (item.email || '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [activeList, searchQuery]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(profile)/settings');
    }
  };

  
  const handleUserPress = (targetId: string) => {
    router.push({
      pathname: '/user/[id]',
      params: { id: String(targetId) },
    });
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const targetId = item._id || item.id;
    if (!targetId) return null;

    const fullName =
      `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Marketplace Member';
    const isMe = String(targetId) === String(currentUserId);
    const alreadyFollowing = isFollowingUser(targetId);
    const isUpdatingThis = togglingUserId === targetId;

    return (
      <View className="w-full max-w-2xl self-center">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => handleUserPress(targetId)}
          className="flex-row items-center justify-between bg-white p-3.5 mb-2.5 rounded-2xl border border-gray-100 shadow-sm"
        >
          <View className="flex-row items-center flex-1 pr-3">
            <View className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden items-center justify-center mr-3.5 shrink-0">
              {item.profilePicture ? (
                <Image
                  source={{ uri: item.profilePicture }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={22} color="#6B7280" />
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                  {fullName}
                </Text>
                {item.verified && (
                  <Ionicons name="checkmark-circle" size={15} color="#2563EB" />
                )}
              </View>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {item.role === 'admin' ? 'Verified Admin' : 'Community Member'}
              </Text>
            </View>
          </View>

          {!isMe && (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isUpdatingThis}
              onPress={() => toggleFollow(targetId)}
              className={`px-3.5 py-2 rounded-xl border min-w-[92px] items-center justify-center ${
                alreadyFollowing
                  ? 'bg-gray-100 border-gray-200'
                  : 'bg-blue-600 border-blue-600'
              }`}
            >
              {isUpdatingThis ? (
                <ActivityIndicator
                  size="small"
                  color={alreadyFollowing ? '#374151' : '#FFFFFF'}
                />
              ) : (
                <Text
                  className={`text-xs font-bold ${
                    alreadyFollowing ? 'text-gray-800' : 'text-white'
                  }`}
                >
                  {alreadyFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeScreen>
      <View
        className="flex-1 bg-gray-50 overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
      >
        {/* Top Bar with Back & Menu Toggle Button */}
        <View className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="mr-3 p-1"
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {activeTab === 'followers' ? 'Followers' : 'Following'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.75}
            style={{ width: 42, height: 42 }}
            className="bg-gray-900 rounded-xl items-center justify-center relative"
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Followers / Following Switcher Tabs */}
        <View className="bg-white border-b border-gray-100">
          <View className="w-full max-w-2xl self-center flex-row px-4">
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setActiveTab('followers')}
              className={`flex-1 py-3.5 items-center border-b-2 ${
                activeTab === 'followers' ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  activeTab === 'followers' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                Followers ({followersCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setActiveTab('following')}
              className={`flex-1 py-3.5 items-center border-b-2 ${
                activeTab === 'following' ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  activeTab === 'following' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                Following ({followingCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="w-full max-w-2xl self-center px-4 pt-3.5 pb-1">
          <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 shadow-sm">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${activeTab}...`}
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              className="flex-1 ml-2.5 text-sm text-gray-900"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading / Error / List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : isError ? (
          <View className="w-full max-w-2xl self-center flex-1 justify-center items-center p-6">
            <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
            <Text className="text-sm font-semibold text-gray-700 mt-3 text-center">
              Could not load connections
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 bg-blue-600 px-5 py-2.5 rounded-xl"
            >
              <Text className="text-white text-xs font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
              <FlatList
            className="flex-1 w-full"
            data={filteredUsers}
            keyExtractor={(item, index) => item._id || item.id || String(index)}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 60,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching && !isLoading}
                onRefresh={() => {
                  refetch();
                }}
                tintColor="#2563EB"
                colors={['#2563EB']}
              />
            }
            ListEmptyComponent={
              <View className="w-full max-w-2xl self-center items-center justify-center py-20 px-6">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-base font-bold text-gray-800 text-center">
                  {searchQuery
                    ? 'No matching users'
                    : activeTab === 'followers'
                    ? 'No followers yet'
                    : 'Not following anyone yet'}
                </Text>
                <Text className="text-xs text-gray-500 text-center mt-1 leading-5">
                  {searchQuery
                    ? 'Try searching with a different name.'
                    : activeTab === 'followers'
                    ? 'When buyers or sellers follow your profile, they will appear here.'
                    : 'Follow sellers, service providers, and employers to stay updated on their posts.'}
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
    </SafeScreen>
  );
};

export default FollowersScreen;
