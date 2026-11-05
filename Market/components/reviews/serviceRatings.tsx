import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StarRatingProps {
  rating: number;                            
  maxStars?: number;                         
  size?: number;                             
  isReadOnly?: boolean;                      
  onRatingChange?: (rating: number) => void; 
  className?: string;                        
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 24,
  isReadOnly = false,
  onRatingChange,
  className = '',
}) => {

  const handlePress = async (index: number) => {
    if (isReadOnly || !onRatingChange) return;

    if (process.env.EXPO_OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Safe catch fallback
      }
    }
    
    onRatingChange(index);
  };

  return (
    <View className={`flex-row items-center ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= Math.floor(rating);
        const isHalf = !isFilled && rating > starIndex - 1 && rating < starIndex;

        // Strictly typed Ionicons names that won't throw TS compiler warnings
        let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (isFilled) iconName = 'star';
        else if (isHalf) iconName = 'star-half';

        return (
          <Pressable
            key={starIndex}
            disabled={isReadOnly}
            onPress={() => handlePress(starIndex)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            className="mx-0.5 active:scale-125 transition-transform duration-100"
          >
            <Ionicons
              name={iconName}
              size={size}
              className={isFilled || isHalf ? 'text-amber-400' : 'text-gray-300'}
            />
          </Pressable>
        );
      })}
    </View>
  );
};
