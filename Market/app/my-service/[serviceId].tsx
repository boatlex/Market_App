import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking, ActivityIndicator } from 'react-native';
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

const { width } = Dimensions.get("window");

const ServiceDetailsScreen = () => {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  
  // ⚡ DISPATCH HOOK LAYERS
  const { data: response, isError, isLoading } = useGetServiceProviderById(serviceId || "");
  const deleteMutation = useDeleteServiceProvider();
  const { user } = useAuth();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // Un-box provider data frame object safely matching controller return structural formats
  const provider = response?.success ? response.data : null;
const isOwner =undefined
  // const isOwner = useMemo(() => {
  //   if (!user || !provider) return false;
  //   const providerUser = typeof provider.user === 'object' ? provider.user?._id : provider.user;
  //   const currentUserId = user._id || user.id;
  //   return String(currentUserId) === String(providerUser);
  // }, [user, provider]);

  const handleCallProvider = () => {
    if (!user) {
      Alert.alert(
        "Authentication Required", 
        "Please sign in to view business contact details.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/(auth)") } 
        ]
      );
      return;
    }

    if (provider?.availabilityStatus === "Away") {
      Alert.alert("Notice", "This provider is currently away and may not answer right away.");
    }
    if (!provider?.phoneNumber) {
      Alert.alert("Error", "Business phone number is unavailable.");
      return;
    }
    Linking.openURL(`tel:${provider.phoneNumber}`);
  };

  const handleWhatsAppProvider = () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to message this provider.");
      return;
    }
    
    const targetNumber = provider?.whatsappNumber || provider?.phoneNumber;
    if (!targetNumber) {
      Alert.alert("Error", "No valid contact number found for WhatsApp.");
      return;
    }

    // Standard country format validation injection for local Ghana dials
    const formattedNumber = targetNumber.startsWith('0') 
      ? `233${targetNumber.substring(1)}` 
      : targetNumber;

    const message = `Hello ${provider?.businessName}, I found your service listing on the Ghana Marketplace App and would like to inquire about your services.`;
    Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`);
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

  const validImages = provider.portfolioImages && provider.portfolioImages.length > 0 
    ? provider.portfolioImages 
    : [];

  const displaySalary = provider.pricing?.rate
    ? `GHS ${Number(provider.pricing.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Negotiable";

  return (
    <SafeScreen>
      {/* Absolute Back Header Controls Bar Row */}
      <View className='absolute top-12 left-6 z-10'>
        <TouchableOpacity
          className='bg-black/50 w-12 h-12 rounded-full items-center justify-center border border-white/10'
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={22} color={"#FFFFFF"} />
        </TouchableOpacity>
      </View>

      <ScrollView className='flex-1 bg-white' contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* Work Sample Photos Portfolio Carousel Slider Box */}
        <View className='relative bg-gray-100' style={{ height: 350 }}>
          {validImages.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setSelectedImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {validImages.map((image: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.9}
                    style={{ width }}
                    onPress={() => {
                      setSelectedImageIndex(index);
                      setIsZoomVisible(true);
                    }}
                  >
                    <Image source={{ uri: image }} style={{ width, height: 350 }} contentFit='cover' />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ImageView
                images={validImages.map((img: string) => ({ uri: img }))}
                imageIndex={selectedImageIndex}
                visible={isZoomVisible}
                onRequestClose={() => setIsZoomVisible(false)}
                doubleTapToZoomEnabled={true}
                swipeToCloseEnabled={true}
              />
            </>
          ) : (
            <View style={{ width }} className="h-full items-center justify-center bg-gray-100">
              <Ionicons name="construct-outline" size={56} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs font-bold mt-2">No portfolio pictures uploaded</Text>
            </View>
          )}

          {validImages.length > 1 && (
            <View className='absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5'>
              {validImages.map((_: any, index: number) => (
                <View key={index} className={`h-1.5 rounded-full ${index === selectedImageIndex ? "bg-blue-600 w-5" : "bg-white/60 w-1.5"}`} />
              ))}
            </View>
          )}
        </View>

        {/* Trade Information Blocks Layout Frame */}
        <View className='p-6'>
          <View className='mb-4 flex-row items-center gap-2 flex-wrap'>
            <View className='bg-blue-50 px-3 py-1 rounded-full border border-blue-100'>
              <Text className='text-blue-600 text-xs font-black capitalize'>{provider.category}</Text>
            </View>
            <View className='bg-gray-50 px-3 py-1 rounded-full border border-gray-100'>
              <Text className='text-gray-600 text-xs font-bold capitalize'>{provider.serviceType}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full border ${
              provider.availabilityStatus === 'Available' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
            }`}>
              <Text className={`text-xs font-black ${provider.availabilityStatus === 'Available' ? 'text-emerald-600' : 'text-amber-600'}`}>
                ● {provider.availabilityStatus}
              </Text>
            </View>

           {/* Localized Post Registration Date Badge */}
            {provider.createdAt && (
              <View className='bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex-row items-center gap-1'>
                <Ionicons name="calendar-outline" size={12} color="#7C3AED" />
                <Text className='text-purple-600 text-xs font-medium'>
                  Listed {new Date(provider.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Business Core Titles Panel Row */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Text className='text-gray-900 text-2xl font-bold flex-1'>{provider.businessName}</Text>
              {provider.isVerifiedProvider && (
                <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
              )}
            </View>
            
            {/* Rating Stars Summary Board Metrics */}
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="text-gray-900 font-bold text-sm">
                {Number(provider.averageRating || 0).toFixed(1)}
              </Text>
              <Text className="text-gray-400 text-xs">
                ({provider.totalReviews || 0} reviews)
              </Text>
            </View>
          </View>

          {/* Rate Pricing Metrics Header Row */}
          <View className='flex-row items-center mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100'>
            <View className="flex-1">
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Service Fee Basis</Text>
              <Text className='text-green-600 text-2xl font-black mt-0.5'>
                {displaySalary}
                {provider.pricing?.basis && provider.pricing.basis !== 'contact for quote' && (
                  <Text className="text-gray-500 text-sm font-semibold capitalize"> / {provider.pricing.basis}</Text>
                )}
              </Text>
            </View>
          </View>

          {/* Location Area Info Coordinates Section */}
          {(provider.region || provider.district || provider.location) && (
            <View className="flex-row items-start gap-1.5 mb-6">
              <Ionicons name="location" size={18} color="#EF4444" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-sm">Service Location Area</Text>
                <Text className="text-gray-500 text-xs font-medium mt-0.5">
                  {[provider.location, provider.district, provider.region].filter(Boolean).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Detailed Business Description Field */}
          {provider.description && (
            <View className="mb-6">
              <Text className="text-gray-900 font-bold text-base mb-2">Service Description</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">{provider.description}</Text>
            </View>
          )}

          {/* Owner Operational Purge Controls Dashboard Context Panel */}
          {isOwner && (
            <View className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <Text className="text-rose-950 font-bold text-sm mb-2">Danger Listing Management Panel</Text>
              <TouchableOpacity
                disabled={deleteMutation.isPending}
                onPress={handleProfilePurge}
                activeOpacity={0.8}
                className="h-11 bg-rose-600 rounded-xl flex-row items-center justify-center gap-2 border border-rose-700"
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm">Permanently Purge Listing</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Operational Footer Panel Matrix */}
      {!isOwner && (
        <View className="absolute bottom-0 right-0 left-0 bg-white/95 border-t border-gray-100 p-6 pb-20 flex-row items-center gap-3">
          {/* Action Trigger 1: Core Text Chat Gateway */}
          <TouchableOpacity
            onPress={() => {
              const targetUserObjId = typeof provider.user === 'object' ? provider.user?._id : provider.user;
              router.push({ pathname: "/chat" as any, params: { userId: String(targetUserObjId) } });
            }}
            activeOpacity={0.8}
            className="flex-1 h-12 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Chat</Text>
          </TouchableOpacity>

          {/* Action Trigger 2: WhatsApp Deep Link API Connection */}
          <TouchableOpacity
            onPress={handleWhatsAppProvider}
            activeOpacity={0.8}
            className="flex-1 h-12 bg-emerald-600 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">WhatsApp</Text>
          </TouchableOpacity>

          {/* Action Trigger 3: Cellular Network Telephony Line Engine */}
          <TouchableOpacity
            onPress={handleCallProvider}
            activeOpacity={0.7}
            className="w-12 h-12 bg-gray-900 rounded-xl items-center justify-center"
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeScreen>
  );
};

export default ServiceDetailsScreen;