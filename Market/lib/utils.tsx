import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/expo";
import { setClerkTokenGetter } from "./api"; 
import { useAuth as useCustomAuth } from "../contexts/authContext"; 
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
            wishList:[],
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

export const capitalizeFirstLetter = (text: string) => {
   if (!text || typeof text !== 'string') return '';
   return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}


export const formatDate =(dateString:string)=>{
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US",{month:"short", day:"numeric", year:"numeric"})
}
export const formatMessageTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isSameDay = (dateA?: string, dateB?: string) => {
  if (!dateA || !dateB) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const formatChatDateHeader = (dateString?: string) => {
  if (!dateString) return '';
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return '';

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(target.toISOString(), now.toISOString())) {
    return 'Today';
  }
  if (isSameDay(target.toISOString(), yesterday.toISOString())) {
    return 'Yesterday';
  }

  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};


