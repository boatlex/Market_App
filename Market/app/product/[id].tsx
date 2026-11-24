import { View, Text, Alert, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Dimensions, Linking, ActivityIndicator } from 'react-native'
import React, { useState, useMemo } from 'react'
import useProducts from '../../hooks/useProducts'
import { router, useLocalSearchParams } from 'expo-router'
import { useProduct } from '../../hooks/useProduct'
import { useToggleAvailability } from '../../hooks/useProductToggleAvailability'
import ErrorUi from '../../components/ErrorUi'
import LoadingUi from '../../components/LoadingUi'
import SafeScreen from '../../components/SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import ImageView from '../../components/CrossPlatformImageView';
import { useAuth } from '../../contexts/authContext';
import { getSocket } from '../../sockets/sockets'
import { useReportModalStore } from '../../stores/useReportModalStore'
import ProductComments from '../../components/comments/ProductComments'
import OfferDialog from '../../components/dialogues/OfferDialogue'
import ItemReviewsSection from '../../components/reviews/ItemsReviewsSection'
import RelatedProductCard from '../../components/product/RelatedProductCard'
import { useWindowDimensions } from 'react-native'

// const { width } = Dimensions.get("window")

const ProductDetailsScreen = () => {
  const { id, sellerID } = useLocalSearchParams<{ id: string; sellerID: string }>();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const socket = getSocket()

  const { data: product, isError, isLoading } = useProduct(id)
  const { results: allProducts = [] } = useProducts({ limit: 30 });

  const { user } = useAuth()
  const toggleMutation = useToggleAvailability()
  const openReportModal = useReportModalStore((state) => state.openReportModal);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // 💡 Controlled State for our custom Dialogue component
  const [promptVisible, setPromptVisible] = useState<boolean>(false);
  const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'list'>('grid');

  const parsedSellerId = Array.isArray(sellerID) ? sellerID[0] : sellerID;

    
  const galleryWidth = Math.max(windowWidth - 16, 200);
  const galleryHeight =
    Platform.OS === 'web' && windowWidth >= 768
      ? Math.min(Math.max(Math.round(windowWidth * 0.42), 420), Math.round(windowHeight * 0.65), 620)
      : 400;


  const currentUserId = user?._id || user?.id;
  const productSellerId =
    typeof product?.seller === 'object' ? product.seller?._id : product?.seller;

  const owner =
    Boolean(currentUserId) &&
    (String(currentUserId) === String(parsedSellerId) ||
      String(currentUserId) === String(productSellerId));


  const relatedProducts = useMemo(() => {
    if (!product || !Array.isArray(allProducts)) return [];

    const currentCategory =
      typeof product.category === 'object'
        ? (product.category as any)?._id || (product.category as any)?.name
        : product.category;
    const normalizedCategory = String(currentCategory || '').trim().toLowerCase();
    const normalizedRegion = String(product.region || '').trim().toLowerCase();

    return allProducts
      .filter((item) => {
        // 1. Exclude the currently opened product
        if (String(item._id) === String(product._id)) return false;

        // 2. Match strictly on category or region
        const itemCategory =
          typeof item.category === 'object'
            ? (item.category as any)?._id || (item.category as any)?.name
            : item.category;

        const sameCategory =
          Boolean(normalizedCategory) &&
          String(itemCategory || '').trim().toLowerCase() === normalizedCategory;

        const sameRegion =
          Boolean(normalizedRegion) &&
          String(item.region || '').trim().toLowerCase() === normalizedRegion;

        return sameCategory || sameRegion;
      })
      .sort((a, b) => {
        // Rank: Both match (3) > Category match (2) > Region match (1)
        const getScore = (item: any) => {
          const itemCategory =
            typeof item.category === 'object'
              ? item.category?._id || item.category?.name
              : item.category;

          const catMatch =
            Boolean(normalizedCategory) &&
              String(itemCategory || '').trim().toLowerCase() === normalizedCategory
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
  }, [allProducts, product]);

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

  const handleWhatsAppSeller = () => {
    if (!product?.isAvailable) {
      Alert.alert("Notice", "This product has already been sold.");
      return;
    }
    if (!product?.phoneNumber) {
      Alert.alert("Error", "Seller phone number is unavailable.");
      return;
    }

    // Format phone number for WhatsApp (converts '0XXXXXXXXX' to '233XXXXXXXXX')
    let cleanPhone = product.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = `233${cleanPhone.slice(1)}`;
    }

    const priceText = product?.price ? ` (GHS ${Number(product.price).toLocaleString()})` : '';
    const message = `Hello, I'm interested in your listing "${product?.name}"${priceText} on the marketplace. Is it still available?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web') {
      Linking.openURL(whatsappUrl);
      return;
    }



    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert("Error", "WhatsApp is not installed on your device.");
        }
      })
      .catch(() => {
        Alert.alert("Error", "Unable to open WhatsApp.");
      });
  };


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


  const handleCallMeBackEmit = () => {
    if (!socket || !socket.connected) {
      Alert.alert("Connection Error", "You are currently offline.");
      return;
    }

    socket.emit("requestCallMeBack", {
      sellerId: parsedSellerId,
      productId: id,
      itemDetails: `Requested callback regarding product: "${product?.name}"`
    });

    Alert.alert("Request Sent", "The seller has been instantly notified to contact you back.");
  };



  const handleOfferPrompt = () => {
    if (!socket || !socket.connected) {
      Alert.alert("Connection Error", "You are currently offline.");
      return;
    }
    setPromptVisible(true);
  };


  const handleOfferSubmit = (amount: number) => {
    socket.emit("sendOffer", {
      sellerId: parsedSellerId,
      productId: id,
      itemDetails: `Offered deal on product: "${product?.name}"`,
      offerPrice: amount
    });
    setPromptVisible(false);

    setTimeout(() => {
      Alert.alert("Offer Sent", `Your offer of GHS ${amount} was transmitted successfully!`);
    }, 400);
  };



  if (isLoading) {
    return <LoadingUi />
  }

  if (isError || !product || Object.keys(product).length === 0) {
    return <ErrorUi />
  }

  const validImages = product.images && product.images.length > 0 ? product.images : [];

  return (
    <SafeScreen>
      <KeyboardAvoidingView
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
         enabled={Platform.OS !== 'web'}
        className="flex-1 bg-white"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
          style={{ flex: 1 }}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Gallery */}
          <View className='relative bg-gray-100 m-2' >
            {validImages.length > 0 ? (
              <>
                  <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={Platform.OS === 'web'}
                  onScroll={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / galleryWidth);
                    setSelectedImageIndex(index);
                  }}
                  scrollEventThrottle={16}
                >
                  {validImages.map((image: string, index: number) => (
                   <TouchableOpacity
                      key={index}
                      activeOpacity={0.9}
                      style={{ width: galleryWidth, height: galleryHeight }}
                      onPress={() => {
                        setSelectedImageIndex(index);
                        setIsZoomVisible(true);
                      }}
                    >
                        <Image
                        source={{ uri: image }}
                        style={{ width: galleryWidth, height: galleryHeight }}
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
              <View style={{ width: galleryWidth, height: galleryHeight }} className="items-center justify-center bg-gray-200">
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

            {/* Product Reviews & Ratings */}
            {!owner && (
              <ItemReviewsSection
                targetId={product._id}
                targetType="Product"
                averageRating={product.averageRating}
                totalReviewsCount={product.totalReviews}
                isOwner={owner}
              />
            )}

            {/* Comments Section Divider Layer */}
            <View className='border-t border-gray-100 mt-6 pt-4'>
              <ProductComments productId={id as string} />
            </View>



            {/*  clean Trust & Safety report block directly below the content wrapper */}
            {!owner && (
              <View className="px-6 mt-2">
                <TouchableOpacity
                  onPress={() => openReportModal('Product', product._id)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-4 bg-red-50/60 border border-red-100 rounded-2xl"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-9 h-9 rounded-full bg-red-100 items-center justify-center mr-3">
                      <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">Report this listing</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">Flag this item if you suspect fraud, scams,</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Related Ads */}
          {relatedProducts.length > 0 && (
            <View className="mt-6 pt-6 border-t border-gray-100">
              {/* Header & Single / 2-Column Toggle Bar */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-gray-900 text-lg font-bold">Related Ads</Text>
                  <Text className="text-gray-400 text-xs">
                    More providers in {product.category || product.region || 'this area'}
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

              {/* Related Product Cards */}
              <View className="flex-row flex-wrap gap-3">
                {relatedProducts.map((relatedItem: any) => (
                  <RelatedProductCard
                    key={relatedItem._id}
                    item={relatedItem}
                    viewMode={relatedViewMode}
                    onPress={() =>
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: relatedItem._id },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {/* Floating Action Button Footer for External Actions */}
        {!owner && (
          <View className="absolute bottom-0 right-0 left-0 bg-white/95 border-t border-gray-100 px-4 pt-4 pb-20 flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={handleToggleFavorite}
              activeOpacity={0.7}
              className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite ? "#E11D48" : "#4B5563"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCallSeller}
              activeOpacity={0.8}
              className="flex-1 h-12 bg-blue-600 rounded-xl flex-row items-center justify-center gap-1.5"
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsAppSeller}
              activeOpacity={0.8}
              className="flex-1 h-12 bg-[#25D366] rounded-xl flex-row items-center justify-center gap-1.5"
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 🛠️ Isolated Component Layer */}
      <OfferDialog
        visible={promptVisible}
        onClose={() => setPromptVisible(false)}
        onSubmit={handleOfferSubmit}
      />
    </SafeScreen>
  )
}

export default ProductDetailsScreen;
