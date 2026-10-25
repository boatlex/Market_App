import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ServiceProvider } from '../../types';

interface MyServicesListProps {
  services: ServiceProvider[];
  onEdit: (service: ServiceProvider) => void;
  onDelete: (id: string) => void;
}

export const MyServicesList = ({ services, onEdit, onDelete }: MyServicesListProps) => {
  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListEmptyComponent={() => (
        <View className="items-center justify-center py-20">
          <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 font-extrabold text-sm mt-3">No trade profile registered.</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View className="bg-white border border-gray-100 p-3.5 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center flex-1 mr-3">
            <Image source={{ uri: item.portfolioImages[0] || 'https://placehold.co' }} style={{ width: 64, height: 64 }} className="rounded-xl bg-gray-50" contentFit="cover" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-950 font-black text-sm" numberOfLines={1}>{item.businessName}</Text>
              <Text className="text-gray-500 font-bold text-xs mt-0.5 capitalize">{item.serviceType}</Text>
              <Text className="text-emerald-600 font-extrabold text-[10px] uppercase mt-1">● {item.availabilityStatus}</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => onEdit(item)} className="p-2 bg-blue-50 border border-blue-100 rounded-xl active:bg-blue-100">
              <Ionicons name="create-outline" size={16} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item._id)} className="p-2 bg-rose-50 border border-rose-100 rounded-xl active:bg-rose-100">
              <Ionicons name="trash-outline" size={16} color="#E11D48" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
};
