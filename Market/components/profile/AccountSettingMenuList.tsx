import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { User } from '../../types';
import MenuSectionCard, { MenuItemConfig } from './MenuSectionCard';

interface AccountSettingsMenuListProps {
  user: User | null;
}

export default function AccountSettingsMenuList({
  user,
}: AccountSettingsMenuListProps) {
  const router = useRouter();

  const relatedSecurityItems: MenuItemConfig[] = [
    {
      id: 'privacy-security',
      title: 'Privacy & Security',
      subtitle: 'Phone visibility, online status & safety tips',
      icon: 'lock-closed-outline',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      onPress: () => router.push('/(profile)/privacy-security' as any),
    },
    {
      id: 'account-help',
      title: 'Account & Safety FAQ',
      subtitle: 'Learn how verification & account protection work',
      icon: 'help-buoy-outline',
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      onPress: () => router.push('/(profile)/faq' as any),
    },
  ];

  return (
    <View>
      {/* Account Identity & Verification Overview */}
      <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Account Overview
        </Text>

        <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
          <Text className="text-sm text-gray-500">Email Address</Text>
          <Text
            className="text-sm font-semibold text-gray-900 max-w-[65%]"
            numberOfLines={1}
          >
            {user?.email || 'Not set'}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
          <Text className="text-sm text-gray-500">Account Role</Text>
          <Text className="text-sm font-semibold text-gray-900 capitalize">
            {user?.role || 'user'}
          </Text>
        </View>

        <View className="flex-row items-center justify-between pt-3">
          <Text className="text-sm text-gray-500">Verification Status</Text>
          <View
            className={`flex-row items-center px-2.5 py-1 rounded-full ${
              user?.verified ? 'bg-emerald-50' : 'bg-amber-50'
            }`}
          >
            <Ionicons
              name={user?.verified ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={user?.verified ? '#10B981' : '#F59E0B'}
            />
            <Text
              className={`text-xs font-semibold ml-1 ${
                user?.verified ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {user?.verified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>
      </View>

      {/* Related Security & Help Links */}
      <MenuSectionCard
        sectionTitle="Security & Support"
        items={relatedSecurityItems}
      />
    </View>
  );
}
