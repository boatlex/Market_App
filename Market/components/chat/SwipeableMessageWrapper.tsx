import React, { useRef } from 'react';
import { View, Platform } from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Message } from '../../types';

interface SwipeableMessageWrapperProps {
  message: Message;
  onReply: (message: Message) => void;
  children: React.ReactNode;
}

const INPUT_RANGE = new Array<number>(0, 40);
const OUTPUT_RANGE = new Array<number>(0.5, 1);

const LeftReplyAction = ({ dragX }: { dragX: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      dragX.value,
      INPUT_RANGE,
      OUTPUT_RANGE,
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <View className="justify-center pl-4">
      <Animated.View style={animatedStyle}>
        <Ionicons name="arrow-undo" size={20} color="#6b7280" />
      </Animated.View>
    </View>
  );
};

export const SwipeableMessageWrapper = ({
  message,
  onReply,
  children,
}: SwipeableMessageWrapperProps) => {
  const swipeableRef = useRef<SwipeableMethods>(null);

  // Bypass swipeable wrapper on Web to prevent 0-height FlatList row collapse
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  const renderLeftActions = (
    _progress: SharedValue<number>,
    dragX: SharedValue<number>
  ) => {
    return <LeftReplyAction dragX={dragX} />;
  };

  const handleSwipeOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReply(message);
    swipeableRef.current?.close();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={handleSwipeOpen}
      leftThreshold={40}
      overshootLeft={false}
    >
      {children}
    </ReanimatedSwipeable>
  );
};
