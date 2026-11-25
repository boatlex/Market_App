import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileHeaderCard from '../../components/profile/ProfileHeaderCard';
import AdminQuickAccessCard from '../../components/profile/AdminQuickAccessCard';
import MarketPlaceOverviewCard from '../../components/profile/MarketPlaceOverViewCard';
import ProfileMenuGrid from '../../components/profile/ProfileMenuGrid';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleSafeBack = () => {
    const canGoBack =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
        : router.canGoBack();

    if (canGoBack) {
      router.back();
    } else {
      router.replace('/(tabs)' as Href);
    }
  };

  return (
    <SafeScreen>
      <View
        className="flex-1 bg-gray-50 overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
      >
        {/* Full-Width Top Navigation Bar with Centered Desktop Content */}
        <View className="w-full border-b border-surface bg-gray-400">
          <View className="w-full max-w-3xl self-center px-6 pb-5 pt-12 md:pt-5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                className="mr-4"
                onPress={handleSafeBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white font-bold text-2xl">Profile</Text>
            </View>

            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.push('/(profile)/settings' as Href)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="settings-outline" size={26} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsMenuOpen(true)}
                activeOpacity={0.75}
                className="bg-white/20 p-2 rounded-xl relative"
              >
                <Ionicons name="menu" size={26} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Full-Width ScrollView so Desktop Scrollbar Sits Flush on Right Edge */}
        <ScrollView
          className="flex-1 w-full bg-gray-50"
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingBottom: 150,
          }}
        >
          {/* Centered Profile Cards & Menu Grid */}
          <View className="w-full max-w-3xl self-center">
            <ProfileHeaderCard user={user} />
            <AdminQuickAccessCard isAdmin={isAdmin} />
            <MarketPlaceOverviewCard />
            <ProfileMenuGrid isAdmin={isAdmin} unreadCount={unreadCount} />
          </View>
        </ScrollView>

        {/* Column Slide-Out Menu Drawer */}
        <ProfileMenuDrawer
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isAdmin={isAdmin}
          unreadCount={unreadCount}
          side="right"
        />
      </View>
    </SafeScreen>
  );
}
