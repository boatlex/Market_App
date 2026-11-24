import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { JobItem } from '../../hooks/useGetJobs';

interface JobCardProps {
  item: JobItem;
  onPress: () => void;
  cardWidth?: number;
}

export const JobCard = ({ item, onPress, cardWidth }: JobCardProps) => {
  const { width: screenWidth } = useWindowDimensions();

  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const horizontalPadding = 32;
  const totalGap = (numColumns - 1) * 12;
  const computedWidth = cardWidth ?? (screenWidth - horizontalPadding - totalGap) / numColumns;
  const imageHeight = Math.round((computedWidth - 24) * (9 / 16)); // Matches 16:9 minus p-3 (24px)

  const fallbackImage = 'https://placehold.co';
  const displayImage = item.jobImage && item.jobImage.trim().length > 0 ? item.jobImage : fallbackImage;

  const displaySalary = item.salary?.min
    ? `${item.salary.currency}${Number(item.salary.min).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : 'Negotiable';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: computedWidth }}
      className="bg-white border border-gray-100/70 rounded-2xl p-3 mb-4 shadow-sm flex-col justify-between"
    >
      {/* 1. Header Frame - Image Banner & Work Mode Badge Container */}
      <View
        className="relative w-full rounded-xl overflow-hidden bg-gray-50 mb-3"
        style={{ height: imageHeight }}
      >
        <Image
          source={{ uri: displayImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        {/* Absolute Floating Badges Overlay Row */}
        <View className="absolute bottom-1.5 left-1.5 bg-blue-600/90 px-2 py-0.5 rounded-md shadow-sm">
          <Text className="text-[9px] text-white font-black uppercase tracking-wider">
            {item.workMode}
          </Text>
        </View>
      </View>

      {/* 2. Core Operational Metadata Parameters Panel */}
      <View className="flex-1 px-0.5 justify-between">
        <View>
          <Text className="text-gray-950 font-extrabold text-sm leading-snug mb-0.5" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-400 font-semibold text-[11px] mb-2" numberOfLines={1}>
            {item.companyName}
          </Text>
        </View>

        {/* 3. Bottom Financial & Geographic Footprint Row */}
        <View className="pt-2 border-t border-gray-50 flex-col gap-1.5">
          <Text className="text-blue-600 font-black text-xs" numberOfLines={1}>
            {displaySalary}
            {item.salary?.min ? (
              <Text className="text-[9px] text-gray-400 font-medium">
                /{item.salary?.period || 'mo'}
              </Text>
            ) : null}
          </Text>

          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text className="text-[10px] text-gray-400 font-medium ml-0.5 flex-1" numberOfLines={1}>
              {item.location || item.district}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default JobCard;
