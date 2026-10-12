import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { useProduct } from '../../hooks/useProduct'
import { useToggleAvailability } from '../../hooks/useProductToggleAvailability' 
import ErrorUi from '../../components/ErrorUi'
import LoadingUi from '../../components/LoadingUi'
import SafeScreen from '../../components/SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'

const { width } = Dimensions.get("window")

const ProductDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: product, isError, isLoading } = useProduct(id)
  const toggleMutation = useToggleAvailability()
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleCallSeller = () => {
    if (!product?.isAvailable) {
      Alert.alert("Notice", "This product has already been sold.");
      return;
    }
    if (!product?.phoneNumber) {
      Alert.alert("Error", "Seller phone number is unavailable.");
      return;
    }
    Linking.openURL(`tel:${product.phoneNumber}`);
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    Alert.alert(
      "Favorites", 
      !isFavorite ? "Product added to your favorites!" : "Product removed from favorites."
    )
  }

  // NEW: Fire mutation requests straight to your Express backend
  const handleStatusUpdate = () => {
    if (!id) return;
    
    toggleMutation.mutate(id, {
      onSuccess: (data) => {
        Alert.alert("Success", data.message || "Listing status successfully updated!");
      },
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.message || "Something went wrong while updating status.";
        Alert.alert("Action Denied", errorMsg);
      }
    });
  }
 
  if (isLoading) {
    return <LoadingUi />
  }

  if (isError || !product || Object.keys(product).length === 0) {
    return <ErrorUi />
  }

  const validImages = product.images && product.images.length > 0 ? product.images : [];

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
      </View>
      
      <ScrollView
        className='flex-1 bg-white'
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View className='relative bg-gray-100 m-2' >
          {validImages.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width)
                setSelectedImageIndex(index)
              }}
              scrollEventThrottle={16}
            >
              {validImages.map((image: string, index: number) => (
                <View key={index} style={{ width }}>
                  <Image 
                    source={ image }
                    style={{ width, height: 400 }}
                    contentFit='cover'
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ width, height: 400 }} className="items-center justify-center bg-gray-200">
              <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            </View>
          )}

          {/* Image Indicators */}
          {validImages.length > 1 && (
            <View className='absolute bottom-4 left-0 right-0 flex-row justify-center gap-2'>
              {validImages.map((_: any, index: number) => (
                <View
                  key={index}
                  className={`h-2 rounded-full ${index === selectedImageIndex ? "bg-green-600 w-6" : "bg-white/50 w-2"}`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info Content Wrapper */}
        <View className='p-6'>
          
          {/* Badges: Category, Condition & Status */}
          <View className='mb-3 flex-row items-center gap-2'>
            <View className='bg-green-50 px-3 py-1 rounded-full border border-green-100'>
              <Text className='text-green-600 text-xs font-bold capitalize'>{product.category}</Text>
            </View>
            {product.condition && (
              <View className='bg-gray-100 px-3 py-1 rounded-full'>
                <Text className='text-gray-600 text-xs font-semibold'>{product.condition}</Text>
              </View>
            )}
            
            <View className={`px-3 py-1 rounded-full ${product.isAvailable ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
              <Text className={`text-xs font-bold ${product.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {product.isAvailable ? 'Available' : 'Sold Out'}
              </Text>
            </View>
          </View>

          {/* Product Name */}
          <Text className='text-gray-900 text-2xl font-bold mb-3'>{product.name}</Text>
           
          {/* Price formatted in Ghana Cedis */}
          <View className='flex-row items-center mb-4'>
            <Text className='text-green-600 text-3xl font-black'>
              GHS {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* NEW: Management Control Box (Call this only if user owns the listing) */}
          <View className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <Text className="text-gray-950 font-bold text-sm mb-2">Listing Dashboard Controls</Text>
            <TouchableOpacity
              disabled={toggleMutation.isPending}
              onPress={handleStatusUpdate}
              activeOpacity={0.8}
              className={`h-11 rounded-xl flex-row items-center justify-center gap-2 border ${
                product.isAvailable 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              {toggleMutation.isPending ? (
                <ActivityIndicator size="small" color={product.isAvailable ? "#B45309" : "#047857"} />
              ) : (
                <>
                  <Ionicons 
                    name={product.isAvailable ? "ban-outline" : "checkmark-circle-outline"} 
                    size={18} 
                    color={product.isAvailable ? "#B45309" : "#047857"} 
                  />
                  <Text className={`font-semibold text-sm ${product.isAvailable ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {product.isAvailable ? "Mark Listing as Sold" : "Mark Listing as Available"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Localized Marketplace Locations */}
          <View className='flex-row items-center gap-2 bg-gray-50 p-3 rounded-xl mb-6'>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text className='text-gray-600 font-medium text-sm flex-1' numberOfLines={1}>
              {product.location || product.district}, {product.region} Region
            </Text>
          </View>

          {/* Description Block */}
          <View className='mb-8'>
            <Text className='text-gray-900 text-lg font-bold mb-2'>Description</Text>
            <Text className='text-gray-600 text-base leading-6'>{product.description}</Text>
          </View>
        </View>
      </ScrollView>
      

      {/* Floating Bottom Contact & Favorite Action Bar */}
      <View className='absolute bottom-0 left-0 right-0 bg-white p-4 pb-8 border-t border-gray-100 flex-row gap-3 shadow-lg mb-10'>
        {/* Favorite Heart Icon Button */}
        <TouchableOpacity 
          className={`w-14 h-14 rounded-xl items-center justify-center border ${
            isFavorite ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
          }`}
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={26} 
            color={isFavorite ? "#EF4444" : "#4B5563"} 
          />
        </TouchableOpacity>

        {/* Call Action Button */}
        <TouchableOpacity 
          disabled={!product.isAvailable}
          className={`flex-1 h-14 rounded-xl flex-row items-center justify-center gap-2 ${
            product.isAvailable ? 'bg-green-600' : 'bg-gray-300'
          }`}
          onPress={handleCallSeller}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={20} color={product.isAvailable ? "#FFF" : "#9CA3AF"} />
          <Text className={`text-base font-bold ${product.isAvailable ? 'text-white' : 'text-gray-400'}`}>
            {product.isAvailable ? 'Call Seller' : 'Item Sold'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  )
}

export default ProductDetailsScreen;
