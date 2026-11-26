import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import React, { useState } from 'react';
import SafeScreen from '../../components/SafeScreen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import useListings from '../../hooks/useListings';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';
import { CreateListingOptionsModal } from '../../components/CreateListingOptionsModal';

const MyAddsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const isAdmin = user?.role === 'admin';

  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    products: mixedListings,
    isLoading,
    isRefetching,
    isError,
    refetch,
    deleteProduct,
    deletingProductId,
  } = useListings();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleEditPress = (item: any) => {
    const isJobPosting = !!item.employer && 'isOpen' in item;
    const isSeekingJob = 'seekerId' in item || item.listingType === 'seeking_job';
    const isService = item.category === 'Services' || item.listingType === 'service';

    let pathname = '/sell';
    let passingKey = 'productData';

    if (isJobPosting) {
      pathname = '/post-job';
      passingKey = 'jobData';
    } else if (isSeekingJob) {
      pathname = '/post-seeking-job';
      passingKey = 'seekingJobData';
    } else if (isService) {
      pathname = '/post-service';
      passingKey = 'serviceData';
    }

    router.push({
      pathname: pathname as any,
      params: { [passingKey]: JSON.stringify(item) },
    });
  };

  const handleDeletePress = (itemId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to permanently delete this listing? This action cannot be undone.'
      );
      if (confirmed) {
        deleteProduct(itemId);
      }
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to permanently delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(itemId),
        },
      ]
    );
  };

  const renderListingCard = ({ item }: { item: any }) => {
    const isJobPosting = !!item.employer && 'isOpen' in item;
    const isSeekingJob = 'seekerId' in item || item.listingType === 'seeking_job';
    const isService = item.category === 'Services' || item.listingType === 'service';

    const fallbackImage = 'https://placehold.co';
    let displayImage = fallbackImage;

    if (isJobPosting) {
      displayImage = item.jobImage || fallbackImage;
    } else if (isSeekingJob) {
      displayImage = item.avatar || item.resumeSnapshot || fallbackImage;
    } else {
      displayImage = item.images && item.images.length > 0 ? item.images[0] : fallbackImage;
    }

    const titleText = isJobPosting || isSeekingJob ? item.title : item.name;
    const subtitleText = isJobPosting
      ? item.companyName
      : isSeekingJob
      ? `${item.applicantName || 'Job Seeker'}`
      : isService
      ? 'Service Provider'
      : 'Marketplace Item';

    let financialMetric = 'Negotiable';
    if (isJobPosting) {
      if (item.salary?.min && item.salary?.max) {
        financialMetric = `${item.salary.currency} ${item.salary.min.toLocaleString()} - ${item.salary.max.toLocaleString()}`;
      }
    } else if (isSeekingJob) {
      if (item.expectedSalary) {
        financialMetric = `Expected: GHS ${Number(item.expectedSalary).toLocaleString()}`;
      }
    } else if (item.price !== undefined) {
      financialMetric = `GHS ${parseFloat(item.price).toFixed(2)}`;
    }

    const isListingActive = isJobPosting ? item.isOpen : item.isAvailable;
    const statusTextLabel = isListingActive
      ? isJobPosting || isSeekingJob
        ? 'Active Pipeline'
        : 'Active Ad'
      : isJobPosting
      ? 'Closed / Filled'
      : 'Sold / Invisible';

    const isThisItemDeleting = deletingProductId === item._id;

    return (
      <View className="w-full max-w-2xl self-center">
        <View className="flex-row bg-white border border-gray-100 rounded-2xl p-3 mb-3.5 shadow-sm items-center">
          <Image
            source={{ uri: displayImage }}
            style={{ width: 80, height: 80, borderRadius: 12 }}
            contentFit="cover"
            cachePolicy="disk"
          />

          <View className="flex-1 ml-4 justify-between h-20 py-0.5">
            <View>
              <Text className="text-gray-950 font-bold text-base" numberOfLines={1}>
                {titleText}
              </Text>
              <Text className="text-gray-400 font-semibold text-xs" numberOfLines={1}>
                {subtitleText}
              </Text>
              <Text className="text-blue-600 font-black text-sm mt-0.5">
                {financialMetric}
              </Text>
            </View>

            <View className="flex-row items-center mt-1">
              <Ionicons
                name={isListingActive ? 'ellipse' : 'ellipse-outline'}
                size={10}
                color={isListingActive ? '#16a34a' : '#dc2626'}
              />
              <Text className="text-[11px] text-gray-500 font-bold ml-1">
                {statusTextLabel}
              </Text>

              <View
                className={`ml-2 px-1.5 py-0.5 rounded border ${
                  isJobPosting
                    ? 'bg-purple-50 border-purple-100'
                    : isSeekingJob
                    ? 'bg-teal-50 border-teal-100'
                    : isService
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-blue-50 border-blue-100'
                }`}
              >
                <Text
                  className={`text-[9px] font-black tracking-wide ${
                    isJobPosting
                      ? 'text-purple-600'
                      : isSeekingJob
                      ? 'text-teal-600'
                      : isService
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                >
                  {isJobPosting
                    ? 'HIRING'
                    : isSeekingJob
                    ? 'SEEKING JOB'
                    : isService
                    ? 'SERVICE'
                    : 'PRODUCT'}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2 border-l border-gray-100 pl-3">
            <TouchableOpacity
              onPress={() => handleEditPress(item)}
              disabled={isThisItemDeleting}
              className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center border border-blue-100"
            >
              <Ionicons name="create-outline" size={18} color="#2563eb" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeletePress(item._id)}
              disabled={isThisItemDeleting}
              className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center border border-red-100"
            >
              {isThisItemDeleting ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
              My Published Ads
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

        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-gray-500 text-sm font-medium mt-2">
                Synchronizing unified catalog...
              </Text>
            </View>
                   ) : isError ? (
            <View className="w-full max-w-2xl self-center flex-1 items-center justify-center px-6">
              <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-700 font-bold text-base mt-4">
                Failed to synchronize catalog
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-3 px-5 py-2.5 bg-blue-600 rounded-xl"
              >
                <Text className="text-white font-semibold">Retry Fetch</Text>
              </TouchableOpacity>
            </View>
          ) : mixedListings?.length === 0 ? (
            <View className="w-full max-w-2xl self-center flex-1 items-center justify-center px-6">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="file-tray-outline" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 font-bold text-lg text-center">
                No published ads yet
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1 leading-5">
                Start selling products, offering services, or posting job openings to reach buyers across Ghana.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCreateOptions(true)}
                className="mt-5 bg-blue-600 px-6 py-3 rounded-xl flex-row items-center gap-2"
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">Create Your First Ad</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              className="flex-1 w-full"
              data={mixedListings}
              keyExtractor={(item) => item._id}
              renderItem={renderListingCard}
              showsVerticalScrollIndicator={Platform.OS === 'web'}
              refreshControl={
                <RefreshControl
                  refreshing={Boolean(isRefetching) && !isLoading}
                  onRefresh={() => {
                    refetch();
                  }}
                  tintColor="#2563EB"
                  colors={['#2563EB']}
                />
              }
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 80,
              }}
            />
          )}
        </View>

        {/* Create Listing Options Modal */}
        <CreateListingOptionsModal
          visible={showCreateOptions}
          onClose={() => setShowCreateOptions(false)}
        />

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

export default MyAddsScreen;
