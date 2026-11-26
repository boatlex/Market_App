import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import LoadingUi from '../../components/LoadingUi';
import ErrorUi from '../../components/ErrorUi';
import { useAuth } from '../../contexts/authContext';
import useFollow from '../../hooks/useFollow';
import usePublicUserProfile from '../../hooks/usePublicUserProfile';

type ProfileTab = 'products' | 'services' | 'jobs';

const FALLBACK_IMAGE = 'https://placehold.co';

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const targetUserId = Array.isArray(id) ? id[0] : id;

  const { user: currentUser } = useAuth();
  const router = useRouter();

  const currentUserId = currentUser?._id || currentUser?.id;
  const isMe = Boolean(currentUserId) && String(currentUserId) === String(targetUserId);

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = usePublicUserProfile(targetUserId);

  const {
    followersCount,
    followingCount,
    toggleFollow,
    togglingUserId,
    isFollowingUser,
  } = useFollow(targetUserId);

  const [activeTab, setActiveTab] = useState<ProfileTab>('products');

  if (isLoading) return <LoadingUi />;
  if (isError || !data?.user) return <ErrorUi />;

  const { user: profileUser, products = [], services = [], jobs = [], jobSeekerProfile } = data;

  const fullName =
    `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim() ||
    'Marketplace Member';

  const isFollowing = isFollowingUser(targetUserId);
  const isToggling = togglingUserId === targetUserId;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleMessageUser = () => {
    if (!currentUser) {
      router.push('/(auth)');
      return;
    }
    router.push({
      pathname: '/chat',
      params: { userId: String(targetUserId) },
    });
  };

  return (
    <SafeScreen>
      <View
        className="flex-1 bg-gray-50 overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
      >
        {/* Top Bar */}
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
              {fullName}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 w-full"
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
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
        >
          <View className="w-full max-w-2xl self-center">
            {/* Profile Hero Card */}
            <View className="bg-white mx-4 rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden items-center justify-center mr-4 shrink-0">
                  {profileUser.profilePicture ? (
                    <Image
                      source={{ uri: profileUser.profilePicture }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={30} color="#6B7280" />
                  )}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-lg font-extrabold text-gray-900" numberOfLines={1}>
                      {fullName}
                    </Text>
                    {profileUser.verified && (
                      <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                    )}
                  </View>

                  {profileUser.createdAt && (
                    <Text className="text-xs text-gray-400 mt-0.5">
                      Member since{' '}
                      {new Date(profileUser.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>

              {/* Followers / Following Counters */}
              <View className="flex-row border-y border-gray-100 my-4 py-3">
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/(profile)/followers',
                      params: { tab: 'followers', userId: String(targetUserId) },
                    })
                  }
                  className="flex-1 items-center border-r border-gray-100"
                >
                  <Text className="text-base font-extrabold text-gray-900">
                    {followersCount}
                  </Text>
                  <Text className="text-xs text-gray-500">Followers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/(profile)/followers',
                      params: { tab: 'following', userId: String(targetUserId) },
                    })
                  }
                  className="flex-1 items-center"
                >
                  <Text className="text-base font-extrabold text-gray-900">
                    {followingCount}
                  </Text>
                  <Text className="text-xs text-gray-500">Following</Text>
                </TouchableOpacity>
              </View>

              {/* Follow & Message Action Buttons */}
              {!isMe && (
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isToggling}
                    onPress={() => {
                      if (!currentUser) {
                        router.push('/(auth)');
                        return;
                      }
                      toggleFollow(targetUserId!);
                    }}
                    className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                      isFollowing
                        ? 'bg-gray-100 border-gray-200'
                        : 'bg-blue-600 border-blue-600'
                    }`}
                  >
                    {isToggling ? (
                      <ActivityIndicator
                        size="small"
                        color={isFollowing ? '#111827' : '#FFFFFF'}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name={isFollowing ? 'checkmark' : 'person-add-outline'}
                          size={17}
                          color={isFollowing ? '#111827' : '#FFFFFF'}
                        />
                        <Text
                          className={`text-sm font-bold ${
                            isFollowing ? 'text-gray-900' : 'text-white'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleMessageUser}
                    className="flex-1 py-3 rounded-xl bg-gray-900 flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name="chatbubble-outline" size={17} color="#FFFFFF" />
                    <Text className="text-sm font-bold text-white">Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Job Seeker Banner (if this user has an active candidate profile) */}
            {jobSeekerProfile && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/look-for-job/[id]' as any,
                    params: {
                      id: jobSeekerProfile._id,
                      jobSeekerId: String(targetUserId),
                    },
                  })
                }
                className="bg-blue-50 border border-blue-100 mx-4 rounded-2xl p-4 mb-4 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[11px] font-bold uppercase text-blue-600">
                    Candidate Profile
                  </Text>
                                   <Text className="text-sm font-bold text-gray-900 mt-0.5" numberOfLines={1}>
                    {jobSeekerProfile.professionalHeadline || 'Open to Work'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#2563EB" />
              </TouchableOpacity>
            )}

            {/* Listings Tabs */}
            <View className="flex-row bg-white mx-4 rounded-2xl border border-gray-100 p-1 mb-4">
              <TouchableOpacity
                onPress={() => setActiveTab('products')}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === 'products' ? 'bg-gray-900' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'products' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Products ({products.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('services')}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === 'services' ? 'bg-gray-900' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'services' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Services ({services.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('jobs')}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === 'jobs' ? 'bg-gray-900' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'jobs' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Jobs ({jobs.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View className="px-4">
              {activeTab === 'products' &&
                (products.length > 0 ? (
                  products.map((item: any) => (
                    <TouchableOpacity
                      key={item._id}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/product/[id]',
                          params: { id: item._id, sellerID: String(targetUserId) },
                        })
                      }
                      className="flex-row items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-3"
                    >
                      <Image
                        source={{ uri: item.images?.[0] || FALLBACK_IMAGE }}
                        style={{ width: 72, height: 72, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3.5">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                          {[item.district, item.region].filter(Boolean).join(', ')}
                        </Text>
                        <Text className="text-sm font-extrabold text-green-600 mt-1">
                          GHS {Number(item.price || 0).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-center text-xs text-gray-400 py-10">
                    No active products listed.
                  </Text>
                ))}

              {activeTab === 'services' &&
                (services.length > 0 ? (
                  services.map((sp: any) => (
                    <TouchableOpacity
                      key={sp._id}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/my-service/[serviceId]',
                          params: { serviceId: sp._id },
                        })
                      }
                      className="flex-row items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-3"
                    >
                      <Image
                        source={{ uri: sp.portfolioImages?.[0] || FALLBACK_IMAGE }}
                        style={{ width: 72, height: 72, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3.5">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {sp.businessName}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5 capitalize" numberOfLines={1}>
                          {sp.category} • {sp.serviceType}
                        </Text>
                        <Text className="text-sm font-extrabold text-blue-600 mt-1">
                          {sp.pricing?.rate
                            ? `GHS ${Number(sp.pricing.rate).toLocaleString()}`
                            : 'Negotiable'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-center text-xs text-gray-400 py-10">
                    No services listed.
                  </Text>
                ))}

              {activeTab === 'jobs' &&
                (jobs.length > 0 ? (
                  jobs.map((jobItem: any) => (
                    <TouchableOpacity
                      key={jobItem._id}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/job/[id]' as any,
                          params: { id: jobItem._id, employerId: String(targetUserId) },
                        })
                      }
                      className="flex-row items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-3"
                    >
                      <Image
                        source={{ uri: jobItem.jobImage || FALLBACK_IMAGE }}
                        style={{ width: 72, height: 72, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3.5">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {jobItem.title}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                          {jobItem.companyName} • {jobItem.workMode}
                        </Text>
                        <Text className="text-xs font-bold text-purple-600 mt-1">
                          {jobItem.jobType || 'Full-time'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-center text-xs text-gray-400 py-10">
                    No open job listings.
                  </Text>
                ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

