import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface ChatAudioMessageProps {
  fileUrl: string;
  duration: number;
  isPeer: boolean;
}

export const ChatAudioMessage: React.FC<ChatAudioMessageProps> = ({ fileUrl, duration, isPeer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      // Initial load sequence configuration
      setIsLoadingSound(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoadingSound(false);
    } catch (error) {
      setIsLoadingSound(false);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
        soundRef.current?.setPositionAsync(0);
      }
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
        disabled={isLoadingSound}
        className={`w-8 h-8 rounded-full items-center justify-center ${isPeer ? 'bg-gray-200' : 'bg-blue-700'}`}
      >
        {isLoadingSound ? (
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
