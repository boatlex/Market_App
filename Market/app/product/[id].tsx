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
import ImageView from 'react-native-image-viewing';
import { useAuth } from '../../contexts/authContext';
import { getSocket } from '../../sockets/sockets'

const { width } = Dimensions.get("window")

const ProductDetailsScreen = () => {
  const { id, sellerID } = useLocalSearchParams<{ id: string; sellerID: string }>();
  const socket = getSocket()

  const { data: product, isError, isLoading } = useProduct(id)
  const { user } = useAuth()
  const toggleMutation = useToggleAvailability()

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isZoomVisible, setIsZoomVisible] = useState(false);


  const parsedSellerId = Array.isArray(sellerID) ? sellerID[0] : sellerID;
  const owner = user?.id === parsedSellerId;


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

  // 📞 Live Trigger: Call Me Back Request
  const handleCallMeBackEmit = () => {
    if (!socket || !socket.connected) {
      Alert.alert("Connection Error", "You are currently offline. Check your socket status.");
      return;
    }

    socket.emit("requestCallMeBack", {
      //sellerId: parsedSellerId,
      itemDetails: `Requested callback regarding product: "${product?.name}"`
    });

    Alert.alert("Request Sent", "The seller has been instantly notified to contact you back.");
  }

  // 💰 Live Trigger: Send Negotiation Offer Prompt
  const handleOfferPrompt = () => {
    if (!socket || !socket.connected) {
      Alert.alert("Connection Error", "You are currently offline.");
      return;
    }

    Alert.prompt(
      "Make an Offer",
      "Enter your negotiation offer amount in GHS:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: (amount) => {
            if (!amount || isNaN(Number(amount))) {
              Alert.alert("Error", "Please enter a valid numeric value.");
              return;
            }

            socket.emit("sendOffer", {
              //sellerId: parsedSellerId,
              itemDetails: `Offered deal on product: "${product?.name}"`,
              offerPrice: amount
            });

            Alert.alert("Offer Sent", `Your offer of GHS ${amount} was transmitted successfully!`);
          }
        }
      ],
      "plain-text",
      ""
    );
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
            <>
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
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.9}
                    style={{ width }}
                    onPress={() => {
                      setSelectedImageIndex(index);
                      setIsZoomVisible(true);
                    }}
                  >
                    <Image
                      source={image}
                      style={{ width, height: 400 }}
                      contentFit='cover'
                    />
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
            <View style={{ width, height: 400 }} className="items-center justify-center bg-gray-200">
              <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            </View>
          )}

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
          {/* Badges: Category, Condition, Status & Post Date */}
          <View className='mb-3 flex-row items-center flex-wrap gap-2'>
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

            {/* Localized Post Date Badge */}
            {product.createdAt && (
              <View className='bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex-row items-center gap-1'>
                <Ionicons name="calendar-outline" size={12} color="#2563EB" />
                <Text className='text-blue-600 text-xs font-medium'>
                  {new Date(product.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Geography Context Layout */}
          <View className='flex-row items-center gap-2 bg-gray-50 p-3.5 rounded-xl mb-6 border border-gray-100/50'>
            <Ionicons name="location-outline" size={20} color="#4B5563" />
            <Text className='text-gray-600 text-sm font-medium flex-1' numberOfLines={2}>
              {product.location}, {product.district} - {product.region}
            </Text>
          </View>

          {/* Product Name */}
          <Text className='text-gray-900 text-2xl font-bold mb-3'>{product.name}</Text>

          {/* Price formatted in Ghana Cedis */}
          <View className='flex-row items-center mb-4'>
            <Text className='text-green-600 text-3xl font-black'>
              GHS {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Management Control Box (Renders conditionally for the item owner) */}
          {owner ? (
            <View className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <Text className="text-gray-950 font-bold text-sm mb-2">Listing Dashboard Controls</Text>
              <TouchableOpacity
                disabled={toggleMutation.isPending}
                onPress={handleStatusUpdate}
                activeOpacity={0.8}
                className={`h-11 rounded-xl flex-row items-center justify-center gap-2 border ${product.isAvailable
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
                    <Text style={{ color: product.isAvailable ? "#B45309" : "#047857" }} className="font-bold text-sm">
                      {product.isAvailable ? "Mark as Sold Out" : "Re-activate Listing"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Buyer Interactive Buttons Panel */
            <View className="gap-3 mb-6">
              {/* Primary Action: Direct App Chat */}
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/chat" as any, params: { userId: parsedSellerId } })}
                activeOpacity={0.8}
                className="h-12 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">Chat with Seller</Text>
              </TouchableOpacity>

              {/* Secondary Actions: Quick Triggers */}
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={handleCallMeBackEmit}
                  activeOpacity={0.8}
                  className="flex-1 h-12 bg-amber-500 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm">Call Me Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOfferPrompt}
                  activeOpacity={0.8}
                  className="flex-1 h-12 bg-green-600 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm">Make an Offer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}


          {/* Description Section */}
          <Text className="text-gray-900 font-bold text-base mb-2">Description</Text>
          <Text className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</Text>
        </View>
      </ScrollView>

      {/* Floating Action Button Footer for External Actions */}
      {!owner && (
        <View className="absolute bottom-0 right-0 left-0 bg-white/95 border-t border-gray-100 p-6 pb-20 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"
          >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#E11D48" : "#4B5563"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCallSeller}
            activeOpacity={0.8}
            className="flex-1 h-12 bg-green-600 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-base">Contact via Phone</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeScreen>
  )
}

export default ProductDetailsScreen;
