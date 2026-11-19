import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';

interface AdminQuickAccessCardProps {
  isAdmin: boolean;
}

export default function AdminQuickAccessCard({ isAdmin }: AdminQuickAccessCardProps) {
  const router = useRouter();

  if (!isAdmin) return null;

  return (
    <View className="px-4 pt-5 gap-3">
      <TouchableOpacity
        onPress={() => router.push('/admin' as Href)}
        activeOpacity={0.8}
        className="bg-gray-900 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-xl bg-red-500/20 items-center justify-center">
            <Ionicons name="shield-checkmark" size={24} color="#F87171" />
          </View>
          <View>
            <Text className="text-white font-bold text-base">Admin Console</Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              Manage reports, feedback, listings & users
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/admin/regional-stats' as Href)}
        activeOpacity={0.8}
        className="bg-blue-950 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-xl bg-blue-500/20 items-center justify-center">
            <Ionicons name="map" size={24} color="#60A5FA" />
          </View>
          <View>
            <Text className="text-white font-bold text-base">Regional Insights</Text>
            <Text className="text-blue-200/70 text-xs mt-0.5">
              Stats by regions & districts
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#93C5FD" />
      </TouchableOpacity>
    </View>
  );
}
