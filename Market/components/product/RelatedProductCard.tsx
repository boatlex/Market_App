import React from 'react';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface RelatedProductCardProps {
  item: any;
  onPress: () => void;
  viewMode: 'grid' | 'list';
}

const { width } = Dimensions.get('window');
// Accounts for px-6 (48px total padding) + 12px spacing between 2 columns
const GRID_CARD_WIDTH = (width - 60) / 2;

export const RelatedProductCard = ({
  item,
  onPress,
  viewMode,
}: RelatedProductCardProps) => {
  const isList = viewMode === 'list';

  // Support both images[] array or single image string
  const firstImage =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : item.image || 'https://placehold.co';

  const formattedPrice =
    typeof item.price === 'number'
      ? `GHS ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : 'Contact for price';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={isList ? { width: '100%' } : { width: GRID_CARD_WIDTH }}
      className={`bg-white border border-gray-100 rounded-2xl p-3 mb-3 shadow-sm ${
        isList ? 'flex-row items-center gap-3' : 'flex-col justify-between'
      }`}
    >
      {/* Product Image */}
      <View
        className={`relative rounded-xl overflow-hidden bg-gray-100 ${
          isList ? 'w-24 h-24' : 'w-full aspect-square mb-2.5'
        }`}
      >
        <Image
          source={{ uri: firstImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        {item.condition && (
          <View className="absolute bottom-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded-md">
            <Text className="text-[9px] text-white font-bold uppercase tracking-wider">
              {item.condition}
            </Text>
          </View>
        )}
      </View>

      {/* Product Details */}
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-gray-950 font-extrabold text-sm leading-snug mb-1"
            numberOfLines={1}
          >
            {item.title || item.name}
          </Text>

          <Text className="text-green-600 font-black text-xs mb-2" numberOfLines={1}>
            {formattedPrice}
          </Text>
        </View>

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
