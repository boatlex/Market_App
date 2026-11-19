import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import { useRouter } from 'expo-router';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { confirmAndDeleteAccount, isDeletingAccount } = useDeleteAccount();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are You Sure You Want to Logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'LogOut',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeScreen>
      {/* Top Bar with Menu Button */}
      <View className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 pr-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3 p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
            Settings
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsMenuOpen(true)}
          activeOpacity={0.75}
          style={{ width: 42, height: 42 }}
          className="bg-gray-900 rounded-xl items-center justify-center relative"
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* General Settings Card */}
        <View className="bg-white mx-4 rounded-3xl p-2 shadow-sm mb-8">
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
            onPress={() => router.push('/(profile)/account-settings')}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={22} color="gray" />
              <Text className="text-base font-medium text-black">
                Account Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
            onPress={() => router.push('/(profile)/notifications')}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={22} color="gray" />
              <Text className="text-base font-medium text-black">
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
            onPress={() => router.push('/(profile)/privacy-security')}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="shield-checkmark-outline" size={22} color="#000" />
              <Text className="text-base font-medium text-black">
                Privacy and Security
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="flex-row items-center rounded-xl justify-center py-5 mx-4 mb-8 border-2 border-gray-500/20 bg-white"
          activeOpacity={0.8}
          disabled={isDeletingAccount}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text className="text-red-500 font-bold text-base ml-2">Sign Out</Text>
        </TouchableOpacity>

        {/* Danger Zone (Below Sign Out) */}
        <View className="mx-4 mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 ml-2">
            Danger Zone
          </Text>
          <View className="bg-white rounded-3xl p-2 border border-red-100 shadow-sm">
            <TouchableOpacity
              className="flex-row items-center justify-between p-4"
              activeOpacity={0.7}
              disabled={isDeletingAccount}
              onPress={confirmAndDeleteAccount}
            >
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-red-600">
                    {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    Permanently erase your account and all listings
                  </Text>
                </View>
              </View>

              {isDeletingAccount ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text className="mt-2 mx-6 text-xs text-gray-500 text-center">
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Column Slide-Out Menu Drawer (change side="left" if preferred) */}
      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        side="right"
      />
    </SafeScreen>
  );
};

export default SettingsScreen;
