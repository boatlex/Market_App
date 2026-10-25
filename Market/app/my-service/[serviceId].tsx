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
  const { id} = useLocalSearchParams<{ id: string }>();
  
  // ⚡ DISPATCH HOOK LAYERS
  const { data: response, isError, isLoading } = useGetServiceProviderById(id || "");
  const deleteMutation = useDeleteServiceProvider();
  const { user } = useAuth();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // Un-box provider data frame object safely matching controller return structural formats
  const provider = response?.success ? response.data : null;

  // Resolve ownership mapping indices securely
  const isOwner = useMemo(() => {
    if (!user || !provider) return false;
    const providerUser = typeof provider.user === 'object' ? provider.user?._id : provider.user;
    return user.id === providerUser || user._id === providerUser;
  }, [user, provider]);

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
          </View>

          <Text className='text-gray-950 font-black text-2xl mb-1 leading-snug'>{provider.businessName}</Text>
          
          <View className="flex-row items-center gap-1 mb-4">
            <Ionicons name="location" size={14} color="#2563EB" />
            <Text className="text-gray-500 text-xs font-bold">{provider.location}, {provider.district}</Text>
          </View>

          <View className='flex-row items-baseline mb-6 border-b border-gray-50 pb-5'>
            <Text className='text-blue-600 text-3xl font-black'>{displaySalary}</Text>
            {provider.pricing?.rate ? (
              <Text className='text-gray-400 font-bold text-xs ml-1 lowercase'>/{provider.pricing.basis}</Text>
            ) : null}
          </View>

          <Text className="text-gray-900 font-black text-sm mb-2">Service Portfolio Bio</Text>
          <Text className='text-gray-600 text-sm font-semibold leading-relaxed mb-8'>{provider.description}</Text>

                   {/* 🛠️ OWNER CONTROLS ACTION SEGMENT */}
          {isOwner && (
            <View className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl mb-6">
              <Text className="text-rose-950 font-black text-sm mb-1.5">Business Profile Management</Text>
              <Text className="text-rose-400 text-[11px] font-semibold mb-4 leading-normal">
                You registered this service profile business entry slot. You have active permissions to modify or clear the row directory entry entirely.
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  onPress={() => router.push({ pathname: "/post-service", params: { serviceProviderData: JSON.stringify(provider) } })}
                  className="flex-1 bg-white border border-gray-200 h-12 rounded-xl items-center justify-center flex-row gap-1 active:bg-gray-50"
                >
                  <Ionicons name="create-outline" size={16} color="#4B5563" />
                  <Text className="text-gray-700 font-extrabold text-xs">Edit Listing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  disabled={deleteMutation.isPending}
                  onPress={handleProfilePurge}
                  className="flex-1 bg-rose-600 h-12 rounded-xl items-center justify-center flex-row gap-1 active:bg-rose-700"
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#FFF" />
                      <Text className="text-white font-extrabold text-xs">Delete Profile</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/*  BOTTOM CONTACT TRADING PANEL BAR (Hidden if owned by viewer) */}
      {!isOwner && (
        <View className="absolute bottom-0 right-0 left-0 bg-white border-t border-gray-100 px-6 pt-4 pb-8 flex-row gap-3 shadow-xl">
          <TouchableOpacity 
            onPress={handleWhatsAppProvider}
            className="flex-1 border border-emerald-500 bg-emerald-50 h-14 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-emerald-100"
          >
            <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
            <Text className="text-emerald-700 font-black text-sm">WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleCallProvider}
            className="flex-1 bg-blue-600 h-14 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-blue-700 shadow-sm"
          >
            <Ionicons name="call" size={18} color="#FFF" />
            <Text className="text-white font-black text-sm">Call Business</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeScreen>
  );
};

export default ServiceDetailsScreen;
