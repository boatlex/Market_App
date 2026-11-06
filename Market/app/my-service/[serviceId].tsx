import { View, Text, Alert, TouchableOpacity, Dimensions, Linking, ActivityIndicator, TextInput, Modal } from 'react-native';
import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetServiceProviderById } from '../../hooks/useGetServiceProviderById';
import { useDeleteServiceProvider } from '../../hooks/useDeleteServiceProvider';
import ErrorUi from '../../components/ErrorUi';
import LoadingUi from '../../components/LoadingUi';
import SafeScreen from '../../components/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ImageView from 'react-native-image-viewing';
import { useAuth } from '../../contexts/authContext';
import { useReportModalStore } from '../../stores/useReportModalStore';
import { ScrollView } from 'react-native-gesture-handler';

import { StarRating } from '../../components/reviews/serviceRatings';
import { ProviderReviewsList } from '../../components/reviews/serviceProviderReviewList';
import { useServiceProviderReviews } from '../../hooks/useServiceProviderReviews';

const { width } = Dimensions.get("window");

const ServiceDetailsScreen = () => {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const { data: response, isError, isLoading } = useGetServiceProviderById(serviceId || "");
  const deleteMutation = useDeleteServiceProvider();
  const { user } = useAuth();
  
  // 🚩 Report Modal Global Store Hook
  const openReportModal = useReportModalStore((state) => state.openReportModal);

  const { addReview, isAddingReview } = useServiceProviderReviews(serviceId || "");
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  const provider = response?.success ? response.data : null;

  const isOwner = useMemo(() => {
    if (!user || !provider) return false;
    const providerUser = typeof provider.user === 'object' ? provider.user?._id : provider.user;
    const currentUserId = user._id || user.id;
    return String(currentUserId) === String(providerUser);
  }, [user, provider]);

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

  // 💬 In-App Chat Action Handler
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

  const handleSubmitReview = () => {
    if (formRating === 0) return;
    addReview({ rating: formRating, comment: formComment }, {
      onSuccess: () => {
        setIsReviewModalVisible(false);
        setFormRating(0);
        setFormComment('');
      }
    });
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
      </View>

      {/* Main Profile Context Layout */}
      <View className="p-6">
        <View className="mb-4 flex-row items-center justify-between flex-wrap">
          <View className="flex-row items-center gap-2">
            <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100"><Text className="text-blue-600 text-xs font-black capitalize">{provider.category}</Text></View>
            <View className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100"><Text className="text-gray-600 text-xs font-bold capitalize">{provider.serviceType}</Text></View>
          </View>

          {/* 🚩 REPORT BUTTON */}
          {!isOwner && (
            <TouchableOpacity 
              onPress={() => openReportModal("Service", provider._id)}
              className=" flex-row p-2 bg-red-50 rounded-full border border-red-100 "
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-2xl font-black text-gray-900 mt-1">{provider.businessName}</Text>
        
        <View className="flex-row items-center gap-1.5 mt-2 mb-4">
          <StarRating rating={provider.averageRating || 0} isReadOnly size={18} />
          <Text className="text-sm font-bold text-gray-800">{(provider.averageRating || 0).toFixed(1)}</Text>
          <Text className="text-sm text-gray-500">({provider.totalReviews || 0} reviews)</Text>
        </View>

        <View className="flex-row items-center gap-2 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <Ionicons name="location-outline" size={18} color="#4B5563" />
          <Text className="text-gray-600 text-sm font-medium flex-1">{provider.location}, {provider.district} - {provider.region}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-2">About Our Services</Text>
          <Text className="text-gray-600 text-sm leading-relaxed">{provider.description}</Text>
        </View>

        <View className="mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pricing Basis</Text>
            <Text className="text-xl font-black text-blue-600 mt-0.5">{displaySalary}</Text>
          </View>
          <View className="bg-blue-100 px-3 py-1 rounded-md">
            <Text className="text-blue-700 text-xs font-bold capitalize">{provider.pricing?.basis || "Job"}</Text>
          </View>
        </View>

        {/* 🌟 REVIEW LIST HEADER */}
        <View className="flex-row items-center justify-between mb-4 border-t border-gray-100 pt-6">
          <Text className="text-lg font-bold text-gray-900">Community Reviews</Text>
          {!isOwner && (
            <TouchableOpacity onPress={handleOpenReviewModal} className="bg-orange-500 px-4 py-2 rounded-xl">
              <Text className="text-white font-bold text-xs">Write Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeScreen>
           {/* Floating Top Back Control Button */}
      <View className="absolute top-12 left-6 z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-black/50 w-12 h-12 rounded-full items-center justify-center border border-white/10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Single scroll-management hierarchy using internal reviews FlatList container */}
      <ProviderReviewsList
        providerId={serviceId || ""}
        currentUserId={user?._id || user?.id}
        ListHeaderComponent={renderDetailsHeader}
      />

      {/* 📞 FLOATING FOOTER ACTION ROW */}
      <View className="absolute pb-10
       bottom-6 left-6 right-6 flex-row gap-2 bg-white/90 p-3 rounded-2xl border border-gray-100 shadow-lg items-center justify-between">
        {isOwner ? (
          <TouchableOpacity 
            onPress={handleProfilePurge}
            className="flex-1 bg-red-600 items-center justify-center h-12 rounded-xl flex-row gap-2"
          >
            <Ionicons name="trash-outline" size={18} color="#FFF" />
            <Text className="text-white font-bold">Delete Listing Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* 💬 CHAT BUTTON */}
            <TouchableOpacity 
              onPress={handleChatProvider}
              className="flex-1 bg-amber-500 items-center justify-center h-12 rounded-xl flex-row gap-1.5"
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
              <Text className="text-white font-bold text-xs">Chat</Text>
            </TouchableOpacity>

            {/* CALL BUTTON */}
            <TouchableOpacity 
              onPress={handleCallProvider}
              className="flex-1 bg-blue-600 items-center justify-center h-12 rounded-xl flex-row gap-1.5"
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={18} color="#FFF" />
              <Text className="text-white font-bold text-xs">Call</Text>
            </TouchableOpacity>

            {/* WHATSAPP BUTTON */}
            <TouchableOpacity 
              onPress={handleWhatsAppProvider}
              className="flex-1 bg-green-600 items-center justify-center h-12 rounded-xl flex-row gap-1.5"
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
              <Text className="text-white font-bold text-xs">WhatsApp</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 📋 LEAVE A REVIEW DIALOG MODAL */}
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 min-h-[420px]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-gray-900">Leave Feedback</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-700 mb-2 font-bold text-sm">Your Rating</Text>
            <View className="mb-6">
              <StarRating
                rating={formRating}
                isReadOnly={false}
                size={32}
                onRatingChange={(selectedRating) => setFormRating(selectedRating)}
              />
            </View>

            <Text className="text-gray-700 mb-2 font-bold text-sm">Comments</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 h-28"
              placeholder="Tell others about your experience with this service provider..."
              multiline
              textAlignVertical="top"
              value={formComment}
              onChangeText={setFormComment}
            />

            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={formRating === 0 || isAddingReview}
              className={`mt-6 h-14 rounded-xl items-center justify-center ${formRating === 0 || isAddingReview ? 'bg-gray-200' : 'bg-orange-500'}`}
            >
              {isAddingReview ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white font-bold text-base">Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
};

export default ServiceDetailsScreen;
