import { View, Text, Alert, TouchableOpacity, Dimensions, Linking, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetServiceProviderById } from '../../hooks/useGetServiceProviderById';
import { useDeleteServiceProvider } from '../../hooks/useDeleteServiceProvider';
import ErrorUi from '../../components/ErrorUi';
import LoadingUi from '../../components/LoadingUi';
import SafeScreen from '../../components/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ImageView from '../../components/CrossPlatformImageView.native';
import { useAuth } from '../../contexts/authContext';
import { useReportModalStore } from '../../stores/useReportModalStore';
import { ScrollView } from 'react-native-gesture-handler';
import { useSearchServiceProviders } from '../../hooks/useSearchServiceProviders';
import { ProviderReviewsList } from '../../components/reviews/serviceProviderReviewList';
import { useServiceProviderReviews } from '../../hooks/useServiceProviderReviews';
import RelatedServiceCard from '../../components/createService/RelatedServiceCard';
import { ServiceProvider } from '../../types';
import { WriteReviewModal } from '../../components/reviews/WriteReviewModal';

const { width } = Dimensions.get("window");

const ServiceDetailsScreen = () => {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const { data: response, isError, isLoading } = useGetServiceProviderById(serviceId || "");
  const { data: providersData } = useSearchServiceProviders({ page: 1, limit: 30 });
  const deleteMutation = useDeleteServiceProvider();
  const { user } = useAuth();

  const openReportModal = useReportModalStore((state) => state.openReportModal);

  const { addReview, isAddingReview } = useServiceProviderReviews(serviceId || "");
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);


  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'list'>('grid');

  const provider = response?.success ? response.data : null;

  const isOwner = useMemo(() => {
    if (!user || !provider) return false;
    const providerUser = typeof provider.user === 'object' ? provider.user?._id : provider.user;
    const currentUserId = user._id || user.id;
    return String(currentUserId) === String(providerUser);
  }, [user, provider]);

  // Filter strictly by category and region
  const relatedServices = useMemo(() => {
    if (!provider) return [];

    const providersList = providersData?.providers || [];
    if (!Array.isArray(providersList)) return [];

    const normalizedCategory = String(provider.category || '').trim().toLowerCase();
    const normalizedRegion = String(provider.region || '').trim().toLowerCase();

    return providersList
      .filter((item) => {
        if (String(item._id) === String(provider._id)) return false;

        const sameCategory =
          Boolean(normalizedCategory) &&
          String(item.category || '').trim().toLowerCase() === normalizedCategory;

        const sameRegion =
          Boolean(normalizedRegion) &&
          String(item.region || '').trim().toLowerCase() === normalizedRegion;

        return sameCategory || sameRegion;
      })
      .sort((a, b) => {
        const getScore = (item: ServiceProvider) => {
          const catMatch =
            Boolean(normalizedCategory) &&
              String(item.category || '').trim().toLowerCase() === normalizedCategory
              ? 2
              : 0;
          const regMatch =
            Boolean(normalizedRegion) &&
              String(item.region || '').trim().toLowerCase() === normalizedRegion
              ? 1
              : 0;
          return catMatch + regMatch;
        };

        return getScore(b) - getScore(a);
      })
      .slice(0, 6);
  }, [providersData, provider]);

  const handleCallProvider = () => {
    if (!user) { router.push("/(auth)"); return; }
    if (!provider?.phoneNumber) return Alert.alert("Error", "Business number unavailable.");
    Linking.openURL(`tel:${provider.phoneNumber}`);
  };

  const handleWhatsAppProvider = () => {
    if (!user) { router.push("/(auth)"); return; }
    const targetNumber = provider?.whatsappNumber || provider?.phoneNumber;
    if (!targetNumber) return Alert.alert("Error", "No valid contact number found.");
    const formattedNumber = targetNumber.startsWith('0') ? `233${targetNumber.substring(1)}` : targetNumber;
    const message = `Hello ${provider?.businessName}, I found your listing on the Ghana Marketplace App...`;
    Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`);
  };

  const handleChatProvider = () => {
    if (!user) { router.push("/(auth)"); return; }
    const providerUserId = typeof provider?.user === 'object' ? provider?.user?._id : provider?.user;
    if (!providerUserId) return Alert.alert("Error", "Cannot initialize chat with this provider.");

    router.push({
      pathname: '/chat',
      params: {
        userId: providerUserId,
      }
    });
  };

  const handleOpenReviewModal = () => {
    if (!user) { Alert.alert("Authentication Required", "Please sign in to leave a review."); return; }
    setIsReviewModalVisible(true);
  };



  const handleSubmitReview = ({ rating, comment }: { rating: number; comment?: string }) => {
    if (rating === 0) return;
    addReview(
      { rating, comment },
      {
        onSuccess: () => {
          setIsReviewModalVisible(false);
        },
      }
    );
  };


  const handleProfilePurge = () => {
    Alert.alert(
      "Delete Profile? ⚠️",
      "Are you sure you want to permanently delete your trade business listing from the public directory?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete permanently",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync();
              Alert.alert("Profile Deleted", "Your trade business listing has been purged.");
              router.replace('/all-service' as any);
            } catch (err) {
              Alert.alert("Error", "Could not remove listing profile.");
            }
          }
        }
      ]
    );
  };

  if (isLoading) return <LoadingUi />;
  if (isError || !provider) return <ErrorUi />;

  const validImages = provider.portfolioImages || [];
  const displaySalary = provider.pricing?.rate ? `GHS ${Number(provider.pricing.rate).toLocaleString()}` : "Negotiable";

  const renderDetailsHeader = () => (
    <View className="bg-white">
      {/* Carousel Portfolio Section */}
      <View style={{ height: 350 }} className="relative bg-gray-100">
        {validImages.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => setSelectedImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              scrollEventThrottle={16}
            >
              {validImages.map((image: string, index: number) => (
                <TouchableOpacity key={index} activeOpacity={0.9} style={{ width }} onPress={() => setIsZoomVisible(true)}>
                  <Image source={{ uri: image }} style={{ width, height: 350 }} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ImageView
              images={validImages.map((img: string) => ({ uri: img }))}
              imageIndex={selectedImageIndex}
              visible={isZoomVisible}
              onRequestClose={() => setIsZoomVisible(false)}
            />
          </>
        ) : (
          <View style={{ width }} className="h-full items-center justify-center bg-gray-100">
            <Ionicons name="construct-outline" size={56} color="#9CA3AF" />
          </View>
        )}

        {/* Back Button */}
        <View className="absolute top-12 left-5 right-5 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Details Block */}
      <View className="p-6">
        <View className="flex-row items-center justify-between gap-2 mb-2">
          <View className={`px-3 py-1 rounded-full ${provider.availabilityStatus === 'Available' ? 'bg-green-50' : 'bg-amber-50'}`}>
            <Text className={`text-xs font-bold ${provider.availabilityStatus === 'Available' ? 'text-green-600' : 'text-amber-600'}`}>
              {provider.availabilityStatus || 'Available'}
            </Text>
          </View>
          {provider.category && (
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-blue-600 text-xs font-bold">{provider.category}</Text>
            </View>
          )}

          {/* 🚩 REPORT BUTTON */}
          {!isOwner && (
            <TouchableOpacity
              onPress={() => openReportModal("Service", provider._id)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full border border-red-100"
              activeOpacity={0.7}
            >
              <Text className="text-red-600 text-xs font-semibold">Report</Text>
              <Ionicons name="flag-outline" size={16} color="#DC2626" />
            </TouchableOpacity>

          )}
        </View>

        <Text className="text-2xl font-extrabold text-gray-900 mb-1">{provider.businessName}</Text>
        <Text className="text-sm font-semibold text-gray-500 mb-3 capitalize">{provider.serviceType}</Text>

        <Text className="text-blue-600 text-2xl font-black mb-4">
          {displaySalary}
          {provider.pricing?.rate && provider.pricing?.basis ? (
            <Text className="text-gray-400 text-sm font-normal"> / {provider.pricing.basis}</Text>
          ) : null}
        </Text>

        {(provider.region || provider.district || provider.location) && (
          <View className="flex-row items-center gap-1.5 mb-5">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-gray-600 font-medium text-sm">
              {[provider.location, provider.district, provider.region].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {(provider as any).description && (
          <View className="mb-6">
            <Text className="text-gray-900 font-bold text-base mb-1.5">About Service</Text>
            <Text className="text-gray-600 text-sm leading-relaxed">
              {(provider as any).description}
            </Text>
          </View>
        )}

        {/* Owner Delete or Customer Review Action */}
        {isOwner ? (
          <TouchableOpacity
            onPress={handleProfilePurge}
            className="bg-red-50 border border-red-200 py-3.5 rounded-xl flex-row items-center justify-center gap-2 mb-4"
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text className="text-red-600 font-bold text-sm">Delete Service Listing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleOpenReviewModal}
            className="bg-orange-50 border border-orange-200 py-3.5 rounded-xl flex-row items-center justify-center gap-2 mb-2"
          >
            <Ionicons name="star-outline" size={18} color="#EA580C" />
            <Text className="text-orange-600 font-bold text-sm">Write  Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Customer Reviews Section Header */}
      <View className="px-6 py-3 border-t border-gray-100 flex-row items-center justify-between">
        <Text className="text-gray-900 text-lg font-bold">Customer Reviews</Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text className="text-gray-800 font-bold text-sm">
            {Number((provider as any).averageRating || 0).toFixed(1)} ({(provider as any).totalReviews || 0})
          </Text>
        </View>
      </View>
    </View>
  );

  // Rendered in ListFooterComponent so it appears BELOW Customer Reviews and scrolls smoothly
  const renderRelatedServices = () => {
    if (relatedServices.length === 0) return null;

    return (
      <View className="mt-6 pt-6 px-6 border-t border-gray-100 bg-white">
        {/* Header & Single-Icon Layout Toggle Button */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-900 text-lg font-bold">Related Ads</Text>
            <Text className="text-gray-400 text-xs">
              More providers in {provider.category || provider.region || 'this area'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              setRelatedViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))
            }
            activeOpacity={0.7}
            className="bg-gray-100 p-2 rounded-xl border border-gray-200/70"
          >
            <Ionicons
              name={relatedViewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={20}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        {/* Related Service Cards (2-column grid or 1-column list) */}
        <View className="w-full flex-row flex-wrap justify-between">
          {relatedServices.map((relatedItem) => (
            <RelatedServiceCard
              key={relatedItem._id}
              item={relatedItem}
              viewMode={relatedViewMode}
              onPress={() =>
                router.push({
                  pathname: '/my-service/[serviceId]',
                  params: { serviceId: relatedItem._id },
                })
              }
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeScreen>
      <ProviderReviewsList
        providerId={serviceId || ""}
        currentUserId={user?._id || user?.id}
        ListHeaderComponent={renderDetailsHeader}
        ListFooterComponent={renderRelatedServices()}
      />

      {/* Sticky Contact Action Dock */}
      {!isOwner && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4  pb-20 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleCallProvider}
            className="flex-1 bg-blue-600 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWhatsAppProvider}
            className="flex-1 bg-green-600 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChatProvider}
            className="bg-gray-100 p-3.5 rounded-xl items-center justify-center"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      )}



      {/* 📋 LEAVE A REVIEW DIALOG MODAL */}

      <WriteReviewModal
        visible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        onSubmit={handleSubmitReview}
        isSubmitting={isAddingReview}
        businessName={provider.businessName}
      />


    </SafeScreen>
  );
};

export default ServiceDetailsScreen;
