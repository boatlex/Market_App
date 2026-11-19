import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_MENU_ITEMS, ProfileGridItem } from './ProfileMenuGrid';

interface ProfileMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  isAdmin: boolean;
  unreadCount: number;
  side?: 'left' | 'right';
}

export default function ProfileMenuDrawer({
  visible,
  onClose,
  isAdmin,
  unreadCount,
  side = 'right',
}: ProfileMenuDrawerProps) {
  const router = useRouter();

  const allItems: ProfileGridItem[] = [
    ...BASE_MENU_ITEMS,
    {
      id: 12,
      icon: 'settings-outline',
      title: 'Settings',
      color: '#374151',
      action: '/(profile)/settings' as Href,
    },
    ...(isAdmin
      ? [
          {
            id: 10,
            icon: 'shield-checkmark-outline' as const,
            title: 'Admin Console',
            color: '#DC2626',
            action: '/admin' as Href,
          },
          {
            id: 11,
            icon: 'map-outline' as const,
            title: 'Regional Insights',
            color: '#2563EB',
            action: '/admin/regional-stats' as Href,
          },
        ]
      : []),
  ];

  const handleNavigate = (action: Href) => {
    onClose();
    router.push(action);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 bg-black/50 ${
          side === 'right' ? 'flex-row justify-end' : 'flex-row justify-start'
        }`}
      >
        {side === 'right' && <Pressable className="flex-1" onPress={onClose} />}

        {/* Compact Vertical Column Menu Drawer */}
        <SafeAreaView className="w-[68%] max-w-[240px] bg-white h-full shadow-2xl">
          {/* Drawer Header */}
          <View className="px-4 py-3.5 border-b border-gray-100 flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-gray-900">Menu</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Compact Single-Column Vertical Menu List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 10, paddingBottom: 40 }}
          >
            {allItems.map((item) => {
              const isNotificationItem = item.id === 1;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate(item.action)}
                  className="flex-row items-center px-2.5 py-2.5 rounded-2xl mb-1 active:bg-gray-50"
                >
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
                    style={{ backgroundColor: item.color + '18' }}
                  >
                    <Ionicons name={item.icon} size={17} color={item.color} />
                  </View>

                  <Text
                    className="text-xs font-semibold text-gray-900 mr-1.5"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  {isNotificationItem && unreadCount > 0 && (
                    <View className="bg-red-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 mr-1">
                      <Text className="text-white text-[10px] font-bold">
                        {unreadCount}
                      </Text>
                    </View>
                  )}

                  <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>

        {side === 'left' && <Pressable className="flex-1" onPress={onClose} />}
      </View>
    </Modal>
  );
}
