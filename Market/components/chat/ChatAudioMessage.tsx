import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio'; // Updated for SDK 58

interface ChatAudioMessageProps {
  fileUrl: string;
  duration: number;
  isPeer: boolean;
}

export const ChatAudioMessage: React.FC<ChatAudioMessageProps> = ({ fileUrl, duration, isPeer }) => {
  // Use the reactive state layout straight from the expo-audio player object
  const player = useAudioPlayer(fileUrl);
  const [isPlaying, setIsPlaying] = useState(player.playing);
  const [isLoaded, setIsLoaded] = useState(player.isLoaded);

  useEffect(() => {
    // Monitor playing status changes dynamically via hook listener using correct types
    const statusSubscription = player.addListener('playbackStatusUpdate', (status) => {
      setIsLoaded(status.isLoaded);
      setIsPlaying(status.playing); // Correct layout property name 'playing'

      if (status.isLoaded && status.playing === false && status.currentTime >= duration) {
        player.seekTo(0);
      }
    });

    return () => {
      statusSubscription.remove();
    };
  }, [player, duration]);

  const handlePlayPause = () => {
    if (!isLoaded) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <View className="flex-row items-center gap-3 px-1 py-1 w-[180px]">
      <TouchableOpacity 
        onPress={handlePlayPause} 
        disabled={!isLoaded}
        className={`w-8 h-8 rounded-full items-center justify-center ${isPeer ? 'bg-gray-200' : 'bg-blue-700'}`}
      >
        {!isLoaded ? (
          <ActivityIndicator size="small" color={isPeer ? "#4B5563" : "#FFF"} />
        ) : (
          <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isPeer ? "#4B5563" : "#FFF"} />
        )}
      </TouchableOpacity>
      <View className="flex-1">
        <Text className={`text-xs font-bold ${isPeer ? 'text-gray-700' : 'text-white'}`}>
          Voice Note
        </Text>
        <Text className={`text-[10px] mt-0.5 ${isPeer ? 'text-gray-400' : 'text-blue-200'}`}>
          {formatTime(duration || 0)}
        </Text>
      </View>
    </View>
  );
};
