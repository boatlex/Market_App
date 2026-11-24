import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { JobSeekerProfile } from '../../types';

interface SeekCardProps {
  item: JobSeekerProfile;
  onPress: () => void;
  cardWidth?: number;
}

export const SeekJobCard = ({ item, onPress, cardWidth }: SeekCardProps) => {
  const { width: screenWidth } = useWindowDimensions();

  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const horizontalPadding = 32;
  const totalGap = (numColumns - 1) * 12;
  const computedWidth = cardWidth ?? (screenWidth - horizontalPadding - totalGap) / numColumns;
  const imageSize = Math.max(computedWidth - 24, 100); // Square image accounting for p-3 (24px)

  const fallbackImage = "https://placehold.co";

  const rawImage =
    item.profilePicture ||
    (typeof item.user === 'object' && (item.user as any)?.profilePicture);
  const displayImage = rawImage && rawImage.trim().length > 0 ? rawImage : fallbackImage;

  const getDisplayName = () => {
    if (typeof item.user === 'object' && item.user) {
      const u = item.user as any;
      if (u.firstName || u.lastName) {
        return `${u.firstName || ''} ${u.lastName || ''}`.trim();
      }
      if (u.name) return u.name;
    }
    return 'Candidate File';
  };

  const displayName = getDisplayName();

  const displaySalary = item.expectedSalary?.min
    ? `${item.expectedSalary.currency} ${Number(item.expectedSalary.min).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "Negotiable";

  const preferredTypesLabel =
    item.preferredJobTypes && item.preferredJobTypes.length > 0
      ? item.preferredJobTypes.length > 1
        ? `${item.preferredJobTypes[0]} +${item.preferredJobTypes.length - 1}`
        : item.preferredJobTypes[0]
      : "Any Type";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: computedWidth }}
      className="bg-white border border-gray-100 rounded-2xl p-3 mb-4 shadow-sm flex-col justify-between"
    >
      {/* Header Frame - Candidate Profile Image Avatar */}
      <View
        style={{ width: '100%', height: imageSize }}
        className="relative rounded-xl overflow-hidden bg-gray-50 mb-3"
      >
        <Image
          source={{ uri: displayImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />

        {/* Floating availability indicator pill */}
        <View
          className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md shadow-sm ${
            item.isSearchingForJob ? 'bg-green-600/90' : 'bg-gray-500/90'
          }`}
        >
          <Text className="text-[8px] text-white font-black uppercase tracking-wider">
            {item.isSearchingForJob ? 'Available' : 'Hired'}
          </Text>
        </View>

        {/* Floating Work Mode pill (top-right) */}
        {Boolean(item.workMode) && (
          <View className="absolute top-1.5 right-1.5 bg-black/65 px-2 py-0.5 rounded-md">
            <Text className="text-[8px] text-white font-bold">
              {item.workMode}
            </Text>
          </View>
        )}
      </View>

      {/* Core Candidate Metadata Panel */}
      <View className="flex-1 px-0.5 justify-between">
        <View>
          <Text className="text-gray-950 font-black text-sm leading-snug mb-0.5" numberOfLines={1}>
            {item.professionalHeadline}
          </Text>

          <Text className="text-gray-400 font-bold text-[11px] mb-1.5" numberOfLines={1}>
            {displayName}
          </Text>

          {/* Category & Subcategory (seekJobType) Badges */}
          {Boolean(item.category || item.seekJobType) && (
            <View className="flex-row flex-wrap gap-1 mb-2">
              {Boolean(item.category) && (
                <View className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                  <Text className="text-blue-700 text-[9px] font-bold capitalize" numberOfLines={1}>
                    {item.category}
                  </Text>
                </View>
              )}

              {Boolean(item.seekJobType) && (
                <View className="bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">
                  <Text className="text-purple-700 text-[9px] font-bold capitalize" numberOfLines={1}>
                    {item.seekJobType}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Financial & Preferred Job Types Parameters */}
        <View className="pt-2 border-t border-gray-50 flex-col gap-1">
          <Text className="text-blue-600 font-extrabold text-xs" numberOfLines={1}>
            {displaySalary}
            {item.expectedSalary?.min ? <Text className="text-[8px] text-gray-400 font-medium"> min</Text> : null}
          </Text>

          <View className="flex-row items-center">
            <Ionicons name="briefcase-outline" size={11} color="#9CA3AF" />
            <Text className="text-[10px] text-gray-500 font-semibold ml-1 flex-1" numberOfLines={1}>
              {preferredTypesLabel}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SeekJobCard;
