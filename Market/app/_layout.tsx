import "../global.css";
import { View, Text } from 'react-native';
import React from 'react';
import { Stack } from "expo-router"; // 👈 Only need Stack here

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
