import { StyleSheet } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from "expo-blur";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1DB954",
        tabBarInactiveTintColor: "#B3B3B3",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          borderTopWidth: 0,
          height: 60 + insets.bottom, 
          paddingTop: 8,
          marginHorizontal: 12,
          // If insets.bottom exists, use it natively; otherwise fall back to explicit spacing
          marginBottom: insets.bottom || 16,
          borderRadius: 24,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint='dark'
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          paddingBottom: 4,
        }
      }}
    >
      {/* 🏠 Market (Home) Screen */}
      <Tabs.Screen
        name='index'
        options={{
          title: "Market",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          )
        }}
      />
      
      {/* 💬 Chats/Messages Screen */}
      <Tabs.Screen
        name='messages'
        options={{
          title: "Chats",
          // 🚀 FIX: Destructured "focused" cleanly from callback payload arguments object
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
          )
        }}
      />
      
      {/* 🏷️ Sell Product Screen */}
      <Tabs.Screen
        name='sell'
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'pricetag' : 'pricetag-outline'} size={size} color={color} />
          )
        }}
      />
      
      {/* 🔖 Saved Items Screen */}
      <Tabs.Screen
        name='saved'
        options={{
          title: "Favorates",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          )
        }}
      />
      
      {/* 👤 User Profile Screen */}
      <Tabs.Screen
        name='profile'
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
