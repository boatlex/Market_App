import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from './ProfileMenuDrawer';

interface ProfileTopBarProps {
  title: string;
  fallbackRoute?: Href;
}

const ProfileTopBar = ({
  title,
  fallbackRoute = '/(profile)/settings',
}: ProfileTopBarProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute);
    }
  };

  return (
    <>
      <View className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3 p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
            {title}
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

      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        side="right"
      />
    </>
  );
};

export default ProfileTopBar;
