import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';

export interface ProfileGridItem {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  action: Href;
}

export const BASE_MENU_ITEMS: ProfileGridItem[] = [
  { id: 1, icon: 'notifications-outline', title: 'Notifications', color: '#3B82F6', action: '/(profile)/notifications' as Href },
  { id: 2, icon: 'chatbubble-ellipses-outline', title: 'Feedback', color: '#10B981', action: '/(profile)/feedback' as Href },
  { id: 3, icon: 'people-outline', title: 'Followers', color: '#F59E0B', action: '/(profile)/followers' as Href },
  { id: 4, icon: 'cash-outline', title: 'Make Money', color: '#3B82F6', action: '/(profile)/make-money' as Href },
  { id: 5, icon: 'megaphone-outline', title: 'My Ads', color: '#3B82F6', action: '/(profile)/my-adds' as Href },
  { id: 6, icon: 'help-circle-outline', title: 'FAQ', color: '#3B82F6', action: '/(profile)/faq' as Href },
  { id: 7, icon: 'game-controller-outline', title: 'Play Game', color: '#3B82F6', action: '/(profile)/game-center' as Href },
  { id: 8, icon: 'document-text-outline', title: 'My Applications', color: '#3B82F6', action: '/(profile)/my-job-applications' as Href },
  { id: 9, icon: 'flag-outline', title: 'My Reports', color: '#EF4444', action: '/(profile)/my-reports' as Href },
];

interface ProfileMenuGridProps {
  isAdmin: boolean;
  unreadCount: number;
}

export default function ProfileMenuGrid({ isAdmin, unreadCount }: ProfileMenuGridProps) {
  const router = useRouter();

  const visibleMenuItems: ProfileGridItem[] = isAdmin
    ? [
        ...BASE_MENU_ITEMS,
        {
          id: 10,
          icon: 'shield-checkmark-outline',
          title: 'Admin Panel',
          color: '#DC2626',
          action: '/admin' as Href,
        },
        {
          id: 11,
          icon: 'map-outline',
          title: 'Regional Stats',
          color: '#2563EB',
          action: '/admin/regional-stats' as Href,
        },
      ]
    : BASE_MENU_ITEMS;

  return (
    <View className="flex-row flex-wrap justify-between px-6 mb-3">
      {visibleMenuItems.map((item) => {
        const isNotificationItem = item.id === 1;

        return (
          <TouchableOpacity
            key={item.id}
            style={{ width: '48%' }}
            activeOpacity={0.7}
            onPress={() => router.push(item.action)}
            className="bg-surface rounded-2xl p-6 items-center justify-center mb-4 relative"
          >
            {isNotificationItem && unreadCount > 0 && (
              <View className="absolute top-4 right-4 bg-red-500 min-w-[22px] h-[22px] rounded-full items-center justify-center px-1 z-10 shadow-sm">
                <Text className="text-white text-[11px] font-bold text-center">
                  {unreadCount}
                </Text>
              </View>
            )}

            <View
              className="rounded-full h-16 w-16 mb-4 items-center justify-center"
              style={{ backgroundColor: item.color + '20' }}
            >
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <Text className="text-text-primary font-bold text-base text-center">
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
