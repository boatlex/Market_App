import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import useWishList from '../../hooks/useWishlist'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import ErrorUi from '../../components/ErrorUi'
import LoadingUi from '../../components/LoadingUi'
import { Href } from 'expo-router'

const FavoritesScreen = () => {
  const {
    wishList = [],
    isError,
    isLoading,
    removeFromWishList,
    isRemovingFromWishList, 
    refetch 
  } = useWishList()

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    Alert.alert("Remove From Wishlist", `Remove ${productName} from wishlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", 
        style: "destructive",
        onPress: () => removeFromWishList(productId)
      },
    ])
  }

  if (isError) {
    return (
      <ErrorUi
        title="Wishlist"
        errorMessage="Could not load your wishlist"
        subMessage="Our servers are down. Please try again later."
        onRetry={refetch}
      />
    )
  }

  if (isLoading) {
    return (
      <LoadingUi
        title="Wishlist"
        message="Loading Wishlist..."
      />
    )
  }

  return (
    <SafeScreen>
      {/* Header Panel */}
      <View className='px-6 pb-5 pt-2 border-b border-gray-100 items-center justify-between flex-row'>
        <TouchableOpacity className='mr-4' onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color={"#111827"} />
        </TouchableOpacity>
        <Text className='text-text-primary text-xl font-bold flex-1'>Wishlist</Text>
        <Text className='text-text-tertiary text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full'>
          {wishList.length} {wishList.length === 1 ? "Item" : "Items"}
        </Text>
      </View>

      {/* Empty State */}
      {wishList.length === 0 ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='heart-outline' size={80} color={"#9CA3AF"} />
          <Text className='font-semibold text-text-primary text-xl mt-4'>Your Wishlist is empty</Text>
          <Text className='text-text-secondary text-center mt-2 px-8'>
            Start adding products that you love!
          </Text>
          <TouchableOpacity
            className='bg-primary px-8 py-4 mt-6 rounded-2xl w-full shadow-sm'
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)" as Href)}
          >
            <Text className='text-text-primary font-bold text-base text-center'>
              Browse Products
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Wishlist Item List */
        <ScrollView
          className='flex-1 '
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className='px-6 py-4'>
            {wishList.map((item) => {
              const isThisItemRemoving = isRemovingFromWishList === item._id; 
              const displayImage = item?.images && item.images.length > 0 ? item.images[0] : null;

              return (
                <TouchableOpacity
                  key={item._id}
                  className='bg-white rounded-3xl mb-3 overflow-hidden border border-gray-100 shadow-sm'
                  onPress={() => router.push(`/product/${item._id}` as Href)} // Kept singular to match filesystem route structure
                >
                  <View className='flex-row p-4 relative'>
                    
                    {/* Left: Product Thumbnail Image */}
                    <Image
                      source={displayImage ? { uri: displayImage } : null}
                      className='rounded-2xl bg-gray-100'
                      style={{ width: 96, height: 96 }}
                      contentFit="cover"
                    />

                    {/* Right: Product Details Panel */}
                    <View className='flex-1 ml-4 pr-8 justify-between'>
                      <View>
                        <Text className='text-text-primary font-bold text-base mb-1' numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className='text-green-600 font-extrabold text-lg mb-1'>
                          GHS {item?.price?.toLocaleString() ?? "0.00"}
                        </Text>
                        <Text numberOfLines={1} className="text-gray-500 text-[10px] font-medium uppercase tracking-wide">
                          {item.category} • {item.productType}
                        </Text>
                      </View>

                      {/* Card Metric Sub-footer */}
                      <View className="flex-row justify-between items-center pt-2 border-t border-gray-100 mt-2">
                        <View className="flex-row items-center flex-1 mr-1">
                          <Ionicons name="location-outline" size={12} color="#6B7280" />
                          <Text className="text-gray-500 text-[10px] ml-0.5 flex-1" numberOfLines={1}>
                            {item.location || item.district}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-[9px] shrink-0">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Floating Top-Right: Trash Button Action Box */}
                    <TouchableOpacity
                      className='absolute top-4 right-4 bg-red-50 p-2 rounded-full items-center justify-center'
                      activeOpacity={0.7}
                      onPress={() => handleRemoveFromWishlist(item._id, item.name)}
                      disabled={isThisItemRemoving}
                    >
                      {isThisItemRemoving ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Ionicons name='trash-outline' size={18} color={"#EF4444"} />
                      )}
                    </TouchableOpacity>

                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      )}
    </SafeScreen>
  )
}

export default FavoritesScreen;
