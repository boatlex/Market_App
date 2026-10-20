import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useGetJobSeekerById } from '../../hooks/useGetJobSeekerById'
import ErrorUi from '../../components/ErrorUi'
import LoadingUi from '../../components/LoadingUi'
import SafeScreen from '../../components/SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import ImageView from 'react-native-image-viewing';
import { useAuth } from '../../contexts/authContext';

const { width } = Dimensions.get("window")

const SeekJobDetailsScreen = () => {
  const { id, jobSeekerId} = useLocalSearchParams<{ id: string; jobSeekerId:string }>();
  const { user } = useAuth()

   
  const { data: product, isError, isLoading } = useGetJobSeekerById(id)

  const [isFavorite, setIsFavorite] = useState(false)
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  
  const userId = user?.id
  const owner = userId === (Array.isArray(jobSeekerId) ? jobSeekerId[0] : jobSeekerId);

  const handleCallSeller = () => {
    if (!user) {
      Alert.alert(
        "Authentication Required", 
        "Please sign in to view candidate contact details.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/(auth)") } 
        ]
      );
      return;
    }

    // 2. Profile availability guards
    if (!product?.isSearchingForJob) {
      Alert.alert("Notice", "This candidate is no longer open to job offers.");
      return;
    }
    if (!product?.phoneNumber) {
      Alert.alert("Error", "Candidate phone number is unavailable.");
      return;
    }
    
    Linking.openURL(`tel:${product.phoneNumber}`);
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    Alert.alert(
      "Saved Profiles",
      !isFavorite ? "Candidate added to your saved list!" : "Candidate removed from saved list."
    )
  }

  if (isLoading) {
    return <LoadingUi />
  }

  if (isError || !product || Object.keys(product).length === 0) {
    return <ErrorUi />
  }
   
  const validImages = product.profilePicture && product.profilePicture.trim().length > 0 
    ? [{ uri: product.profilePicture }] 
    : [];
  
  const displayName = product.user && typeof product.user === 'object'
    ? `${(product.user as any).firstName || ''} ${(product.user as any).lastName || ''}`.trim() || "Job Seeker"
    : "Job Seeker";

  return (
    <SafeScreen>
      {/* Absolute Header Overlay */}
      <View className='absolute top-12 right-0 left-0 z-10 px-6 pb-4 flex-row items-center justify-between'>
        <TouchableOpacity
          className='bg-black/50 w-12 h-12 rounded-full items-center justify-center'
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={"#FFFFFF"} />
        </TouchableOpacity>
        
        <TouchableOpacity
          className='bg-black/50 w-12 h-12 rounded-full items-center justify-center'
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? "#EF4444" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className='flex-1 bg-white'
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image View */}
        <View className='relative bg-gray-100 m-2 items-center justify-center' >
          {validImages.length > 0 ? (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ width: '100%' }}
                onPress={() => setIsZoomVisible(true)}
              >
                <Image
                  source={product.profilePicture}
                  style={{ width: '100%', height: 400 }}
                  contentFit='cover'
                />
              </TouchableOpacity>

              <ImageView
                images={validImages}
                imageIndex={0}
                visible={isZoomVisible}
                onRequestClose={() => setIsZoomVisible(false)}
                doubleTapToZoomEnabled={true}
                swipeToCloseEnabled={true}
              />
            </>
          ) : (
            <View style={{ width: width - 16, height: 400 }} className="items-center justify-center bg-gray-200 rounded-xl">
              <Ionicons name="person-outline" size={84} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Info Layout Content Wrapper */}
        <View className='p-6'>
          {/* Status Badges */}
          <View className='mb-3 flex-row items-center gap-2'>
            <View className='bg-green-50 px-3 py-1 rounded-full border border-green-100'>
              <Text className='text-green-600 text-xs font-bold capitalize'>{product.workMode || "On-site"}</Text>
            </View>
            
            <View className={`px-3 py-1 rounded-full ${product.isSearchingForJob ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
              <Text className={`text-xs font-bold ${product.isSearchingForJob ? 'text-emerald-600' : 'text-rose-600'}`}>
                {product.isSearchingForJob ? 'Actively Looking' : 'Hired / Inactive'}
              </Text>
            </View>
          </View>

          {/* Candidate Name & Title */}
          <Text className='text-gray-900 text-2xl font-bold mb-1'>{displayName}</Text>
          <Text className='text-gray-600 text-lg font-medium mb-3'>{product.professionalHeadline}</Text>

          {/* Expected Salary Display mapped from backend min value */}
          <View className='flex-row items-center mb-4'>
            <Text className='text-green-600 text-2xl font-black'>
              {product.expectedSalary?.currency || 'GHS'} {product.expectedSalary?.min?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              <Text className="text-gray-500 text-sm font-normal"> / month expected</Text>
            </Text>
          </View>

          {/* Location Info Block */}
          {(product.region || product.district) && (
            <View className="flex-row items-center gap-1 mb-4">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text className="text-gray-500 font-medium">
                {[product.district, product.region].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {/* Bio Section */}
          {product.bio && (
            <View className="mb-6">
              <Text className="text-gray-900 font-bold text-base mb-2">About Candidate</Text>
              <Text className="text-gray-600 leading-6">{product.bio}</Text>
            </View>
          )}

          {/* Skills Badges Wrapper */}
          {product.skills && product.skills.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-900 font-bold text-base mb-2">Skills</Text>
              <View className="flex-row flex-wrap gap-2">
                {product.skills.map((skill: string, idx: number) => (
                  <View key={idx} className="bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Text className="text-gray-700 text-sm font-medium">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Call Button Footer */}
      {!owner && (
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            className="bg-green-600 h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg"
            activeOpacity={0.8}
            onPress={handleCallSeller}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-base">Contact Candidate</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeScreen>
  );
};

export default SeekJobDetailsScreen;
