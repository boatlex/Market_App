import "../global.css";
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache'; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../contexts/authContext"; 
import RootApp from "../lib/utils"; 
import { connectSocket, disconnectSocket } from "../sockets/sockets"; 
import GlobalReportModal from "../components/reports/GlobalReportsModal"; 

// IMPORT: Added GestureHandlerRootView to establish native responder context
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

const queryClient = new QueryClient();

function NavigationGuard() {
  const { user, authToken, isInitializing } = useAuth(); 
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)"); 
    }
  }, [user, isInitializing, segments]);

  useEffect(() => {
    if (!isInitializing) {
      if (authToken) {
        console.log('🔌 Global NavigationGuard: Syncing token to socket connection structure...');
        connectSocket(authToken as any);
      } else {
        console.log('🔌 Global NavigationGuard: No active session token found, destroying socket connection.');
        disconnectSocket();
      }
    }
  }, [authToken, isInitializing]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
          
            <RootApp />

            <NavigationGuard />
            
            
            <GlobalReportModal />
            
          </GestureHandlerRootView>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
