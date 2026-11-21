import React from 'react';
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { ServiceProvider } from '../../types';

interface RelatedServiceCardProps {
  item: ServiceProvider;
  onPress: () => void;
  viewMode: 'grid' | 'list';
}

export const RelatedServiceCard = ({ item, onPress, viewMode }: RelatedServiceCardProps) => {
  const isList = viewMode === 'list';

  const fallbackImage = "https://placehold.co";
  const displayImage =
    Array.isArray(item.portfolioImages) && item.portfolioImages.length > 0
      ? item.portfolioImages[0]
      : fallbackImage;

  const displayRate = item.pricing?.rate
    ? `${item.pricing.currency || 'GHS'} ${Number(item.pricing.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "Contact for Quote";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: isList ? '100%' : '48.5%' }}
      className={`bg-white border border-gray-100 rounded-2xl p-3 mb-3 shadow-sm ${
        isList ? 'flex-row items-center gap-3' : 'flex-col justify-between'
      }`}
    >
      {/* 1. Image Banner & Availability Pill */}
      <View
        className={`relative rounded-xl overflow-hidden bg-gray-100 ${
          isList ? 'w-24 h-24' : 'w-full aspect-video mb-2.5'
        }`}
      >
        <Image
          source={{ uri: displayImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        <View
          className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md shadow-sm ${
            item.availabilityStatus === 'Available' ? 'bg-green-600/90' : 'bg-amber-500/90'
          }`}
        >
          <Text className="text-[8px] text-white font-black uppercase tracking-wider">
            {item.availabilityStatus || 'Unavailable'}
          </Text>
        </View>
      </View>

      {/* 2. Business Name & Service Type */}
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-gray-950 font-extrabold text-sm leading-snug mb-0.5"
            numberOfLines={1}
          >
            {item.businessName || 'Unnamed Business'}
          </Text>
          <Text
            className="text-gray-400 font-bold text-[11px] mb-2 capitalize"
            numberOfLines={1}
          >
            {item.serviceType || item.category || 'General Service'}
          </Text>
        </View>

        {/* 3. Rate & Location Row */}
        <View
          className={`pt-2 border-t border-gray-100 ${
            isList ? 'flex-row items-center justify-between' : 'flex-col gap-1'
          }`}
        >
          <Text className="text-blue-600 font-black text-xs" numberOfLines={1}>
            {displayRate}
            {item.pricing?.rate && item.pricing?.basis ? (
              <Text className="text-[8px] text-gray-400 font-medium lowercase">
                /{item.pricing.basis.toString().replace('per ', '')}
              </Text>
            ) : null}
          </Text>

          <View className={`flex-row items-center ${isList ? 'max-w-[45%]' : ''}`}>
            <Ionicons name="location-outline" size={11} color="#9CA3AF" />
            <Text
              className="text-[10px] text-gray-400 font-semibold ml-0.5 flex-1"
              numberOfLines={1}
            >
              {item.location || item.district || item.region || 'Ghana'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RelatedServiceCard;
