import "../global.css";
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache'; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/authContext"; 
import RootApp from "../lib/utils"; 

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

const queryClient = new QueryClient();

// This sub-component handles automatic navigation routing shifts
function NavigationGuard() {
  // Destructure the SINGLE unified user session state and initialization flag
  const { user, isInitializing } = useAuth(); 
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    // Check if the user is currently navigating inside the authentication group folders
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (user && inAuthGroup) {
      router.replace("/"); 
    }
  }, [user, isInitializing, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      {/* Add your core dashboard root stack file pointer here as well */}
       <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          
          {/* Mount RootApp here so it intercepts Clerk token streams before views render */}
          <RootApp />

          {/* Mount the Navigation Guard component down inside the AuthProvider context */}
          <NavigationGuard />
          
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
