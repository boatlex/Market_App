import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';

export default function MarketplaceOverviewCard() {
  const router = useRouter();

  return (
    <View className="px-4 py-6">
      <Text className="text-lg font-bold text-gray-800 mb-3">My Marketplace</Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center"
          onPress={() => router.push('/my-activity' as Href)}
          activeOpacity={0.7}
        >
          <Ionicons name="shirt" size={28} color="#1DB954" />
          <Text className="font-semibold text-black mt-1">My Listings</Text>
          <Text className="text-gray-400 text-xs">(12 Active)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center"
          onPress={() => router.push('/(profile)/make-money' as Href)}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet" size={28} color="#1DB954" />
          <Text className="font-semibold text-black mt-1">Earnings</Text>
          <Text className="text-gray-400 text-xs">GHS 340.50</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
