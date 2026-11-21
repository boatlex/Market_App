import React from 'react';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { JobSeekerProfile } from '../../types';

interface RelatedSeekJobCardProps {
  item: JobSeekerProfile;
  onPress: () => void;
  viewMode: 'grid' | 'list';
}

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 60) / 2;

export const RelatedSeekJobCard = ({
  item,
  onPress,
  viewMode,
}: RelatedSeekJobCardProps) => {
  const isList = viewMode === 'list';

  const displayName =
    item.user && typeof item.user === 'object'
      ? `${(item.user as any).firstName || ''} ${(item.user as any).lastName || ''}`.trim() ||
        'Job Seeker'
      : 'Job Seeker';

  const displaySalary = item.expectedSalary?.min
    ? `${item.expectedSalary.currency || 'GHS'} ${Number(item.expectedSalary.min).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : 'Negotiable';

  const fallbackImage = 'https://placehold.co';
  const displayImage =
    item.profilePicture && item.profilePicture.trim().length > 0
      ? item.profilePicture
      : (typeof item.user === 'object' && (item.user as any)?.profilePicture) || fallbackImage;

  const preferredTypesLabel =
    Array.isArray(item.preferredJobTypes) && item.preferredJobTypes.length > 0
      ? item.preferredJobTypes.length > 1
        ? `${item.preferredJobTypes[0]} +${item.preferredJobTypes.length - 1}`
        : item.preferredJobTypes[0]
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={isList ? { width: '100%' } : { width: GRID_CARD_WIDTH }}
      className={`bg-white border border-gray-100 rounded-2xl p-3 mb-3 shadow-sm ${
        isList ? 'flex-row items-center gap-3' : 'flex-col justify-between'
      }`}
    >
      {/* Profile Image */}
      <View
        className={`relative rounded-xl overflow-hidden bg-gray-100 ${
          isList ? 'w-24 h-24' : 'w-full aspect-square mb-2.5'
        }`}
      >
        <Image
          source={{ uri: displayImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        <View className="absolute bottom-1.5 left-1.5 bg-green-600/90 px-2 py-0.5 rounded-md">
          <Text className="text-[9px] text-white font-black uppercase tracking-wider">
            {item.workMode || 'On-site'}
          </Text>
        </View>
      </View>

      {/* Candidate Details */}
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-gray-950 font-extrabold text-sm leading-snug mb-0.5"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            className="text-gray-500 font-semibold text-[11px] mb-1.5"
            numberOfLines={1}
          >
            {item.professionalHeadline || 'Open to work'}
          </Text>

          {/* Category, Subcategory (seekJobType) & Preferred Job Type Badges */}
          {(item.category || item.seekJobType || preferredTypesLabel) ? (
            <View className="flex-row flex-wrap gap-1 mb-2">
              {item.category ? (
                <View className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                  <Text className="text-blue-700 text-[9px] font-bold capitalize" numberOfLines={1}>
                    {item.category}
                  </Text>
                </View>
              ) : null}

              {item.seekJobType ? (
                <View className="bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">
                  <Text className="text-purple-700 text-[9px] font-bold capitalize" numberOfLines={1}>
                    {item.seekJobType}
                  </Text>
                </View>
              ) : null}

              {preferredTypesLabel ? (
                <View className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                  <Text className="text-gray-700 text-[9px] font-semibold" numberOfLines={1}>
                    {preferredTypesLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Expected Salary & Region */}
        <View
          className={`pt-2 border-t border-gray-100 ${
            isList ? 'flex-row items-center justify-between' : 'flex-col gap-1'
          }`}
        >
          <Text className="text-green-600 font-black text-xs" numberOfLines={1}>
            {displaySalary}
            {item.expectedSalary?.min ? (
              <Text className="text-[9px] text-gray-400 font-medium">/mo</Text>
            ) : null}
          </Text>

          <View className={`flex-row items-center ${isList ? 'max-w-[45%]' : ''}`}>
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text
              className="text-[10px] text-gray-400 font-medium ml-0.5"
              numberOfLines={1}
            >
              {item.district || item.region || 'Ghana'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RelatedSeekJobCard;
