import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ServiceProvider } from '../../types';

interface MyServicesListProps {
  services: ServiceProvider[] | any; 
  onEdit: (service: ServiceProvider) => void;
  onDelete: (id: string) => void;
}

export const MyServicesList = ({ services, onEdit, onDelete }: MyServicesListProps) => {
  

  const normalizedServices: ServiceProvider[] = Array.isArray(services)
    ? services
    : (services as any)?.data || (services as any)?.services 
      ? (services as any)?.data || (services as any)?.services
      : services && typeof services === 'object' && (services._id)
        ? [services]
        : [];

  return (
    <FlatList
      data={normalizedServices} 
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={() => (
        <View className="items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 font-extrabold text-sm mt-3 text-center">No Registered Services Found</Text>
          <Text className="text-gray-400 font-medium text-xs mt-1 text-center">Publish your skills as trade listings to start getting clients in Ghana.</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const fallbackImage = "https://placehold.co";
        const displayImage = item.portfolioImages && item.portfolioImages.length > 0 
          ? item.portfolioImages[0] 
          : fallbackImage;

        const displayRate = item.pricing?.rate
          ? `GHS ${Number(item.pricing.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : "Contact for Quote";

        return (
          <View className="bg-white border border-gray-100 p-3.5 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center flex-1 mr-3">
              <Image 
                source={{ uri: displayImage }} 
                style={{ width: 64, height: 64 }} 
                className="rounded-xl bg-gray-50 border border-gray-50" 
                contentFit="cover" 
              />
              <View className="ml-3 flex-1">
                <Text className="text-gray-950 font-black text-sm" numberOfLines={1}>
                  {item.businessName || "Trade Business"}
                </Text>
                <Text className="text-gray-400 font-bold text-xs mt-0.5 capitalize" numberOfLines={1}>
                  🛠️ {item.serviceType || "General Service"}
                </Text>
                <Text className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider mt-1">
                  💵 {displayRate} {item.pricing?.basis ? `/ ${item.pricing.basis}` : ""}
                </Text>
              </View>
            </View>

            {/* Action Item Controllers */}
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => onEdit(item)} 
                className="p-2 bg-blue-50 border border-blue-100 rounded-xl active:bg-blue-100"
              >
                <Ionicons name="create-outline" size={16} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => onDelete(item._id)} 
                className="p-2 bg-rose-50 border border-rose-100 rounded-xl active:bg-rose-100"
              >
                <Ionicons name="trash-outline" size={16} color="#E11D48" />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
};

export default MyServicesList;
