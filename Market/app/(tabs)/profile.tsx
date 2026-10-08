import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import { Href, useRouter } from 'expo-router';

interface MenuItem {
  id: number;
  icon: any;
  title: string;
  color: string;
  action: Href;
}

const Menu_Items: MenuItem[] = [
  { id: 1, icon: "notifications-outline", title: "Notifications", color: "#3B82F6", action: "/(profile)/notifications" as Href },
  { id: 2, icon: "chatbubble-ellipses-outline", title: "Feedback", color: "#10B981", action: "/(profile)/feedback" as Href },
  { id: 3, icon: "people-outline", title: "Followers", color: "#F59E08", action: "/(profile)/followers" as Href },
  { id: 4, icon: "cash-outline", title: "Make Money", color: "#3B82F6", action: "/(profile)/make-money" as Href },
  { id: 5, icon: "megaphone-outline", title: "My Ads", color: "#3B82F6", action: "/(profile)/my-adds" as Href },
  { id: 6, icon: "help-circle-outline", title: "FAQ", color: "#3B82F6", action: "/(profile)/faq" as Href },
  { id: 7, icon: "game-controller-outline", title: "Play Game", color: "#3B82F6", action: "/(profile)/game-center" as Href },
];

const SplashImage = 'https://unsplash.com';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeScreen>
      {/* Header Layout */}
      <View className='px-6 pb-5 pt-12 border-b border-surface flex-row items-center justify-between bg-gray-400'>
        <View className='flex-row items-center'>
          <TouchableOpacity className='mr-4' onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className='text-white font-bold text-2xl'>Profile</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/(profile)/settings' as Href)}>
          <Ionicons name='settings-outline' size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>


      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Profile Summary */}
        <View className="bg-white items-center pt-8 pb-6 px-4 shadow-sm rounded-b-[40px]">
          <View className="relative" style={{ width: 80, height: 80 }}>
            <Image
              source={user?.profilePicture ? { uri: user.profilePicture } : SplashImage}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 4,
                borderColor: '#10B981' // emerald-500 hex code
              }}
              contentFit="cover"
              transition={200}
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

        {/* Grid Layout Elements */}
        <View className='flex-row flex-wrap justify-between px-6 mb-3'>
          {Menu_Items.map((item) => (
            <TouchableOpacity
              className='bg-surface rounded-2xl p-6 items-center justify-center mb-4'
              key={item.id}
              style={{ width: '48%' }}
              activeOpacity={0.7}
              onPress={() => router.push(item.action)}
            >
              <View
                className='rounded-full h-16 w-16 mb-4 items-center justify-center'
                style={{ backgroundColor: item.color + "20" }}
              >
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text className='text-text-primary font-bold text-base text-center'>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}