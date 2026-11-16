import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<unknown>;
  isRefreshing: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
}

export default function RefreshButton({
  onRefresh,
  isRefreshing,
  size = 20,
  color = '#111827',
  activeColor = '#2563EB',
}: RefreshButtonProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isRefreshing, spinAnim]);

    const spin = spinAnim.interpolate({
    inputRange: Array.of(0, 1),
    outputRange: ['0deg', '360deg'],
  });



  return (
    <TouchableOpacity
      onPress={onRefresh}
      disabled={isRefreshing}
      activeOpacity={0.7}
      className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-200"
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons
          name="refresh"
          size={size}
          color={isRefreshing ? activeColor : color}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
