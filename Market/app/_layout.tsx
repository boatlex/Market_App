import "../global.css";
import { View, Text } from 'react-native';
import React from 'react';
import { Stack } from "expo-router";
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <Stack  screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"/>
        </Stack>
      </QueryClientProvider>

    </ClerkProvider>
  )
}