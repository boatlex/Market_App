import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Product } from '../types';
import { useRouter } from 'expo-router';
import useWishList from '../hooks/useWishlist';

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  onFavoriteToggle?: (productId: string, isFav: boolean) => void;
  cardWidth?: number;
}

export const ProductCard = ({ item, onPress, onFavoriteToggle, cardWidth }: ProductCardProps) => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { toggleWishList, isInWishList } = useWishList();

  // Responsive column count & image height
  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const horizontalPadding = 32; // 16px left + 16px right
  const totalGap = (numColumns - 1) * 12;
  const computedWidth = cardWidth ?? (screenWidth - horizontalPadding - totalGap) / numColumns;
  const imageHeight = screenWidth >= 768 ? 200 : 150;

  const isFavorite = isInWishList(item._id);
  const displayImage = item.images && item.images.length > 0 ? item.images[0] : null;

  const handleFavoritePress = () => {
    if (!item._id) return;
    const nextState = !isFavorite;
    toggleWishList(item._id);
    if (onFavoriteToggle) {
      onFavoriteToggle(item._id, nextState);
    }
    if (nextState) {
      router.push('/(tabs)/saved');
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-3 shadow-sm relative"
      style={{ width: computedWidth }}
    >
      {/* IMAGE TRACK CONTAINER */}
      <View className="relative bg-gray-100" style={{ height: imageHeight }}>
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            style={{ width: '100%', height: imageHeight }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-200">
            <Ionicons name="image-outline" size={32} color="#888" />
          </View>
        )}

        {/* CONDITION BADGE OVERLAY */}
        {Boolean(item.condition) && (
          <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded z-10">
            <Text className="text-white text-[10px] font-semibold">{item.condition}</Text>
          </View>
        )}

        {/* FLOATING FAVORITE BUTTON OVERLAY */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFavoritePress}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 items-center justify-center z-10 shadow-sm"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? '#EF4444' : '#4B5563'}
          />
        </TouchableOpacity>
      </View>

      {/* BODY METADATA */}
      <View className="p-3.5 md:p-4">
        <Text numberOfLines={1} className="font-bold text-sm text-gray-900 mb-0.5">
          {item.name}
        </Text>

        <Text className="text-green-600 font-extrabold text-sm mb-1">
          GHS {item.price?.toLocaleString() ?? '0'}
        </Text>

        <Text numberOfLines={1} className="text-gray-500 text-[10px] font-medium mb-1 uppercase tracking-wide">
          {item.category} • {item.productType}
        </Text>

        <View className="flex-row justify-between items-center pt-2 border-t border-gray-50 mt-1">
          <View className="flex-row items-center flex-1 mr-1">
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text className="text-gray-500 text-[10px] ml-0.5 flex-1" numberOfLines={1}>
              {item.location || item.district}
            </Text>
          </View>

          <Text className="text-gray-400 text-[9px] shrink-0">
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
