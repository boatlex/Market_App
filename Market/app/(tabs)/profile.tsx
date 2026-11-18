import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import { Href, useRouter } from 'expo-router';
import useNotifications from '../../hooks/useNotifications';
import ProfileHeaderCard from '../../components/profile/ProfileHeaderCard';

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
  { id: 8, icon: "document-text-outline", title: "My Applications", color: "#3B82F6", action: "/(profile)/my-job-applications" as Href },
  { id: 9, icon: "flag-outline", title: "My Reports", color: "#EF4444", action: "/(profile)/my-reports" as Href },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const isAdmin = user?.role === 'admin';

  const visibleMenuItems: MenuItem[] = isAdmin
    ? [
        ...Menu_Items,
        {
          id: 10,
          icon: "shield-checkmark-outline",
          title: "Admin Panel",
          color: "#DC2626",
          action: "/admin" as Href,
        },
        {
          id: 11,
          icon: "map-outline",
          title: "Regional Stats",
          color: "#2563EB",
          action: "/admin/regional-stats" as Href,
        },
      ]
    : Menu_Items;

  return (
    <SafeScreen>
      {/* Top Navigation Bar */}
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
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* Extracted Profile Header Component */}
        <ProfileHeaderCard user={user} />

        {/* Admin Quick-Access Cards (Visible only to Admins) */}
        {isAdmin && (
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
                    Manage reports, listings & users
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
        )}

        {/* Dashboard Grid Options */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">My Marketplace</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center"
              onPress={() => router.push('/my-activity' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="shirt" size={28} color="#1DB954" />
              <Text className="font-semibold text-black mt-1">My Listings</Text>
              <Text className="text-gray-400 text-xs">(12 Active)</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center">
              <Ionicons name="wallet" size={28} color="#1DB954" />
              <Text className="font-semibold text-black mt-1">Earnings</Text>
              <Text className="text-gray-400 text-xs">GHS 340.50</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid Layout Elements */}
        <View className='flex-row flex-wrap justify-between px-6 mb-3'>
          {visibleMenuItems.map((item) => {
            const isNotificationItem = item.id === 1;

            return (
              <TouchableOpacity
                className='bg-surface rounded-2xl p-6 items-center justify-center mb-4 relative'
                key={item.id}
                style={{ width: '48%' }}
                activeOpacity={0.7}
                onPress={() => router.push(item.action)}
              >
                {isNotificationItem && unreadCount > 0 && (
                  <View className="absolute top-4 right-4 bg-red-500 min-w-[22px] h-[22px] rounded-full items-center justify-center px-1 z-10 shadow-sm">
                    <Text className="text-white text-[11px] font-bold text-center">
                      {unreadCount}
                    </Text>
                  </View>
                )}

                <View
                  className='rounded-full h-16 w-16 mb-4 items-center justify-center'
                  style={{ backgroundColor: item.color + "20" }}
                >
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text className='text-text-primary font-bold text-base text-center'>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
