import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/expo";
import { setClerkTokenGetter } from "./api"; 
import { useAuth as useCustomAuth } from "../app/contexts/authContext"; 
import { User } from "../types"; 

export default function RootApp() {
  const { getToken, isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const { user: customUser, setOAuthUser, isInitializing: isCustomAuthInitializing } = useCustomAuth();

  useEffect(() => {
    if (isClerkLoaded) {
      setClerkTokenGetter(() => getToken());
    }
  }, [getToken, isClerkLoaded]);

  useEffect(() => {
    if (isClerkLoaded) {
      if (isSignedIn && clerkUser) {
        getToken().then((token) => {
          const formattedUser: User = {
            _id: clerkUser.id,
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            role: "user", 
            profilePicture: clerkUser.imageUrl || "",
            verified: true,
            createdAt: clerkUser.createdAt ? clerkUser.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: clerkUser.updatedAt ? clerkUser.updatedAt.toISOString() : new Date().toISOString()
          };
          
          if (!customUser || customUser._id !== clerkUser.id) {
            setOAuthUser(formattedUser, token);
          }
        });
      }
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, customUser, setOAuthUser]);

  if (!isClerkLoaded || isCustomAuthInitializing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="rgb(119, 129, 240)" />
      </View>
    );
  }

  return null; 
}
