import React from 'react';
import { Text, TouchableOpacity, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image'; 
import { ServiceProvider } from '../../types';

interface ServiceCardProps {
  item: ServiceProvider; 
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; 

export const CreateServiceCard = ({ item, onPress }: ServiceCardProps) => {
  const fallbackImage = "https://placehold.co";
  console.log(item)
  const displayImage = item.portfolioImages && item.portfolioImages.length > 0 
    ? item.portfolioImages[0] 
    : fallbackImage;
  
  const displaySalary = item.pricing?.rate
    ? `${item.pricing.currency || 'GHS'} ${Number(item.pricing.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "Contact for Quote";

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: CARD_WIDTH }}
      className="bg-white border border-gray-100/70 rounded-2xl p-3 mb-4 shadow-sm flex-col justify-between"
    >
      {/* 1. Header Frame - Image Banner & Availability Status Pill */}
      <View className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-50 mb-3">
        <Image 
          source={{ uri: displayImage }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
        <View className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md shadow-sm ${
          item.availabilityStatus === 'Available' ? 'bg-green-600/90' : 'bg-amber-500/90'
        }`}>
          <Text className="text-[8px] text-white font-black uppercase tracking-wider">
            {item.availabilityStatus || 'Unavailable'}
          </Text>
        </View>
      </View>

      {/* 2. Core Operational Metadata Parameters Panel */}
      <View className="flex-1 px-0.5 justify-between">
        <View>
          <Text className="text-gray-950 font-extrabold text-sm leading-snug mb-0.5" numberOfLines={1}>
            {item.businessName || 'Unnamed Business'}
          </Text>
          <Text className="text-gray-400 font-bold text-[11px] mb-2 capitalize" numberOfLines={1}>
            {item.serviceType || 'General Service'}
          </Text>
        </View>

        {/* 3. Bottom Financial & Geographic Footprint Row */}
        <View className="pt-2 border-t border-gray-50 flex-col space-y-1">
          <Text className="text-blue-600 font-black text-xs" numberOfLines={1}>
            {displaySalary} 
            {item.pricing?.basis ? (
              <Text className="text-[8px] text-gray-400 font-medium lowercase">
                /{item.pricing.basis.toString().replace('per ', '')}
              </Text>
            ) : null}
          </Text>

          <View className="flex-row items-center mt-0.5">
            <Ionicons name="location-outline" size={11} color="#9CA3AF" />
            <Text className="text-[10px] text-gray-400 font-semibold ml-0.5 flex-1" numberOfLines={1}>
              {item.location || item.district || 'Ghana'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CreateServiceCard;
