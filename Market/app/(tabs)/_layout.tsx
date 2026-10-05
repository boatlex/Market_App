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
          height: 55 + insets.bottom,
          paddingTop: 10,
          marginHorizontal: 30,
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
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: "Market",
          // FIX: Removed the explicit strict ': { color: string; size: number }' type declaration structure 
          // to allow standard Expo Router ColorValue props execution
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='grid' size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
