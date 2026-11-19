import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface CrossPlatformImageViewProps {
  images: { uri: string }[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  doubleTapToZoomEnabled?: boolean;
  swipeToCloseEnabled?: boolean;
}

export default function CrossPlatformImageView({
  images,
  imageIndex,
  visible,
  onRequestClose,
}: CrossPlatformImageViewProps) {
  const [currentIndex, setCurrentIndex] = useState(imageIndex);

  useEffect(() => {
    setCurrentIndex(imageIndex);
  }, [imageIndex, visible]);

  const totalImages = images.length;
  const hasMultiple = totalImages > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRequestClose();
      if (e.key === 'ArrowLeft' && hasMultiple) handlePrev();
      if (e.key === 'ArrowRight' && hasMultiple) handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, hasMultiple, totalImages]);

  const currentImage = images[currentIndex]?.uri;

  if (!visible || !currentImage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 bg-black/90 items-center justify-center p-4">
        <Pressable onPress={onRequestClose} className="absolute inset-0" />

        <View className="absolute top-6 left-6 right-6 z-20 flex-row items-center justify-between">
          {hasMultiple ? (
            <View className="bg-white/15 px-3.5 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">
                {currentIndex + 1} / {totalImages}
              </Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            onPress={onRequestClose}
            activeOpacity={0.8}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {hasMultiple && (
          <TouchableOpacity
            onPress={handlePrev}
            activeOpacity={0.8}
            className="absolute left-4 z-20 w-11 h-11 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <Image
          source={{ uri: currentImage }}
          style={{ width: '82%', height: '78%' }}
          contentFit="contain"
        />

        {hasMultiple && (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            className="absolute right-4 z-20 w-11 h-11 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}
