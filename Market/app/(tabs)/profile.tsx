import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';

export default function ProfileScreen() {
  return (
    <SafeScreen>
      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        
        {/* Header Profile Summary */}
        <View className="bg-white items-center pt-8 pb-6 px-4 shadow-sm rounded-b-[40px]">
          <View className="relative">
            <Image 
              source={{ uri: 'https://unsplash.com' }} 
              className="w-24 h-24 rounded-full border-4 border-emerald-500"
            />
            <View className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-white">
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          </View>
          
          <Text className="text-2xl font-bold text-black mt-3">Alex Morgan</Text>
          <Text className="text-gray-400 font-medium text-sm">Joined October 2026</Text>
          
          {/* Reputation Stars */}
          <View className="flex-row items-center mt-2 bg-gray-100 px-3 py-1 rounded-full">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="text-black font-semibold text-sm ml-1">4.9</Text>
            <Text className="text-gray-400 text-xs ml-1">(48 reviews)</Text>
          </View>
        </View>

        {/* Dashboard Grid Options */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">My Marketplace</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center">
              <Ionicons name="shirt" size={28} color="#1DB954" />
              <Text className="font-semibold text-black mt-1">My Listings</Text>
              <Text className="text-gray-400 text-xs">(12 Active)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center">
              <Ionicons name="wallet" size={28} color="#1DB954" />
              <Text className="font-semibold text-black mt-1">Earnings</Text>
              <Text className="text-gray-400 text-xs">$340.50</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Action Rows List */}
        <View className="bg-white mx-4 rounded-3xl p-2 shadow-sm mb-12">
          {/* Individual Navigation Row Component */}
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={22} color="gray" />
              <Text className="text-base font-medium text-black">Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="lightgray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={22} color="gray" />
              <Text className="text-base font-medium text-black">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="lightgray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="log-out-outline" size={22} color="red" />
              <Text className="text-base font-medium text-red-500">Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeScreen>
  );
}
