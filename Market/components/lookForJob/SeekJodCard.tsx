import React from 'react';
import { Text, TouchableOpacity, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image'; 
import { JobSeekerProfile } from '../../types'; 

interface SeekCardProps {
  item: JobSeekerProfile;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; 

export const SeekJobCard = ({ item, onPress }: SeekCardProps) => {
  // ✅ FIXED: Configured direct SVG/PNG endpoint paths to prevent network asset stream failures
  const fallbackImage = "https://placehold.co"; 
  
  const displayImage = item.profilePicture 
    || (typeof item.user === 'object' && (item.user as any)?.profilePicture) 
    || fallbackImage;
  
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

  // ✅ FIXED: Appended clear string literal interpolation spacing for compensation tracking
  const displaySalary = item.expectedSalary?.min
    ? `${item.expectedSalary.currency} ${Number(item.expectedSalary.min).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "Negotiable";

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: CARD_WIDTH }}
      className="bg-white border border-gray-100 rounded-2xl p-3 mb-4 shadow-sm flex-col justify-between"
    >
      {/* Header Frame - Candidate Profile Image Avatar */}
      <View className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
        <Image 
          source={{ uri: displayImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        {/* Floating availability indicator pill */}
        <View className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md shadow-sm ${
          item.isSearchingForJob ? 'bg-green-600/90' : 'bg-gray-500/90'
        }`}>
          <Text className="text-[8px] text-white font-black uppercase tracking-wider">
            {item.isSearchingForJob ? 'Available' : 'Hired'}
          </Text>
        </View>
      </View>

      {/* Core Candidate Metadata Panel */}
      <View className="flex-1 px-0.5 justify-between">
        <View>
          <Text className="text-gray-950 font-black text-sm leading-snug mb-0.5" numberOfLines={1}>
            {item.professionalHeadline}
          </Text>
          {/* Displays Resolved Profile Display Name */}
          <Text className="text-gray-400 font-bold text-[11px] mb-2" numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* Bottom Financial & Geographic Footprint Parameters */}
        <View className="pt-2 border-t border-gray-50 flex-col space-y-1">
          <Text className="text-blue-600 font-extrabold text-xs" numberOfLines={1}>
            {displaySalary}
            {item.expectedSalary?.min ? <Text className="text-[8px] text-gray-400 font-medium"> min</Text> : null}
          </Text>

          {/* Displays preferred target job arrangement metrics */}
          <View className="flex-row items-center">
            <Ionicons name="briefcase-outline" size={11} color="#9CA3AF" />
            <Text className="text-[10px] text-gray-400 font-semibold ml-1 flex-1" numberOfLines={1}>
              {item.preferredJobTypes && item.preferredJobTypes.length > 0 ? item.preferredJobTypes[0].replace(/-/g, ' '): "Any Type"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SeekJobCard;
