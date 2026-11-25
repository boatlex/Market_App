import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface AddressHeaderProps {
  title: string;
  fallbackRoute?: string;
}

const Header = ({ title, fallbackRoute = '/(tabs)' }: AddressHeaderProps) => {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };

  return (
    <View className="w-full border-b border-surface bg-white">
      <View className="w-full max-w-2xl self-center px-6 pb-5 pt-3 flex-row items-center">
        <TouchableOpacity
          className="mr-4"
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text className="font-bold text-2xl flex-1" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
};

export default Header;
