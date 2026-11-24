import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface RelatedProductCardProps {
  item: any;
  onPress: () => void;
  viewMode: 'grid' | 'list';
  cardWidth?: number;
}

export const RelatedProductCard = ({
  item,
  onPress,
  viewMode,
  cardWidth,
}: RelatedProductCardProps) => {
  const isList = viewMode === 'list';
  const { width: screenWidth } = useWindowDimensions();

  const numColumns = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const horizontalPadding = 48;
  const totalGap = (numColumns - 1) * 12;
  const computedGridWidth =
    cardWidth ?? (screenWidth - horizontalPadding - totalGap) / numColumns;

  const fallbackImage = 'https://placehold.co';
  const rawImage =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : item.image;
  const firstImage =
    typeof rawImage === 'string' && rawImage.trim().length > 0
      ? rawImage
      : fallbackImage;

  const formattedPrice =
    typeof item.price === 'number'
      ? `GHS ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : item.price
        ? `GHS ${Number(item.price).toLocaleString()}`
        : 'Contact for price';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={isList ? { width: '100%' } : { width: computedGridWidth }}
      className={`bg-white border border-gray-100 rounded-2xl p-3 mb-3 shadow-sm ${
        isList ? 'flex-row items-center gap-3' : 'flex-col'
      }`}
    >
      {/* Product Image */}
      <View
        style={
          isList
            ? { width: 96, height: 96 }
            : { width: '100%', aspectRatio: 1 }
        }
        className={`relative rounded-xl overflow-hidden bg-gray-100 ${
          isList ? '' : 'mb-2.5'
        }`}
      >
        <Image
          source={{ uri: firstImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        {Boolean(item.condition) && (
          <View className="absolute bottom-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded-md">
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">
              {item.condition}
            </Text>
          </View>
        )}
      </View>

      {/* Product Details */}
      <View className={isList ? 'flex-1 justify-between' : 'w-full'}>
        <Text
          className="text-gray-950 font-extrabold text-sm leading-snug mb-1"
          numberOfLines={1}
        >
          {item.title || item.name || 'Untitled Product'}
        </Text>

        <Text className="text-green-600 font-black text-xs mb-2" numberOfLines={1}>
          {formattedPrice}
        </Text>

        {/* Location Footer */}
        <View className="pt-2 border-t border-gray-100 flex-row items-center">
          <Ionicons name="location-outline" size={12} color="#9CA3AF" />
          <Text
            className="text-[10px] text-gray-400 font-medium ml-0.5 flex-1"
            numberOfLines={1}
          >
            {[item.district, item.region].filter(Boolean).join(', ') || 'Ghana'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RelatedProductCard;
