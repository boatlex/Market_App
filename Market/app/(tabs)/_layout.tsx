import { StyleSheet, View, Text } from 'react-native';
import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useConversations } from '../../hooks/useConversations';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { conversations } = useConversations();

  const totalUnreadChats = useMemo(
    () => conversations.reduce((sum, item) => sum + (item?.unreadCount ?? 0), 0),
    [conversations]
  );

  const resolveIconColor = (color: unknown) =>
    typeof color === 'string' ? color : '#B3B3B3';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#B3B3B3',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingTop: 8,
          marginHorizontal: 12,
          marginBottom: insets.bottom || 16,
          borderRadius: 24,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          paddingBottom: 4,
        },
      }}
    >
      {/* 🏠 Market (Home) Screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={resolveIconColor(color)}
            />
          ),
        }}
      />

      {/* 💬 Chats/Messages Screen with Live Unread Badge */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size, focused }) => (
            <View className="relative">
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={size}
                color={resolveIconColor(color)}
              />
              {totalUnreadChats > 0 && (
                <View className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#1DB954] items-center justify-center border border-black/80">
                  <Text className="text-[9px] font-extrabold text-black">
                    {totalUnreadChats > 99 ? '99+' : totalUnreadChats}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* 🏷️ Sell Product Screen */}
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'pricetag' : 'pricetag-outline'}
              size={size}
              color={resolveIconColor(color)}
            />
          ),
        }}
      />

      {/* 🔖 Saved Items Screen */}
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Favorates',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={resolveIconColor(color)}
            />
          ),
        }}
      />

      {/* 👤 User Profile Screen */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={resolveIconColor(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
