import React, { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import ImageView from '../CrossPlatformImageView';

interface ChatImageMessageProps {
  uri: string;
  onLongPress?: () => void;
}

export const ChatImageMessage: React.FC<ChatImageMessageProps> = ({
  uri,
  onLongPress,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={250}
        onPress={() => setIsZoomVisible(true)}
        onLongPress={onLongPress}
        className="relative justify-center items-center w-[220px] h-[160px] rounded-xl overflow-hidden bg-black/5"
      >
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
      </TouchableOpacity>

      <ImageView
        images={[{ uri }]}
        imageIndex={0}
        visible={isZoomVisible}
        onRequestClose={() => setIsZoomVisible(false)}
        doubleTapToZoomEnabled
        swipeToCloseEnabled
      />
    </>
  );
};
