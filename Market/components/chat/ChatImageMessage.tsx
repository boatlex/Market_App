import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';

interface ChatImageMessageProps {
  uri: string;
}

export const ChatImageMessage: React.FC<ChatImageMessageProps> = ({ uri }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View className="relative justify-center items-center w-[220px] h-[160px] rounded-xl overflow-hidden bg-black/5">
      <Image 
        source={{ uri }} 
        style={{ width: 220, height: 160 }} 
        contentFit="cover"
        onLoadEnd={() => setIsLoading(false)}
      />
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-gray-100/50">
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      )}
    </View>
  );
};
