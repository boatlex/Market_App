import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from './serviceRatings';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string }) => void;
  isSubmitting?: boolean;
  businessName?: string; 
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  businessName,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track exact keyboard height so Android & iOS Modals never get covered
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Reset form when closed
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
      setKeyboardHeight(0);
    }
  }, [visible]);

  const handlePressSubmit = () => {
    if (rating === 0 || isSubmitting) return;
    Keyboard.dismiss();
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        {/* Tap backdrop to dismiss keyboard first, or close modal if keyboard is closed */}
        <Pressable
          className="flex-1"
          onPress={() => {
            if (keyboardHeight > 0) {
              Keyboard.dismiss();
            } else {
              onClose();
            }
          }}
        />

        {/* Bottom sheet container shifted up by exact keyboardHeight */}
        <View
          style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : 32 }}
          className="bg-white rounded-t-3xl px-6 pt-5"
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 pr-2">
                <Text className="text-lg font-bold text-gray-900">Write a Review</Text>
                {businessName && (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {businessName}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1 rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Star Rating (Adjust prop name if your StarRating uses onChange/onRate) */}
            <View className="items-center py-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size={32}
              />
              <Text className="text-xs text-gray-400 mt-1.5">
                {rating === 0 ? 'Tap a star to rate' : `${rating} out of 5 stars`}
              </Text>
            </View>

            {/* Comment Input */}
            <TextInput
  value={comment}
  onChangeText={setComment}
  placeholder="Share details of your experience..."
  placeholderTextColor="#9CA3AF"
  multiline
  numberOfLines={4}
  textAlignVertical="top"
  returnKeyType="done"              
  submitBehavior="blurAndSubmit"    
  onSubmitEditing={() => Keyboard.dismiss()}
  className="border border-gray-200 rounded-xl p-3.5 mt-3 min-h-[100px] max-h-[160px] text-gray-800 bg-gray-50 text-sm"
/>


            {/* Submit Button */}
            <TouchableOpacity
              onPress={handlePressSubmit}
              disabled={rating === 0 || isSubmitting}
              activeOpacity={0.8}
              className={`mt-5 py-3.5 mb-6 rounded-xl items-center justify-center ${
                rating === 0 ? 'bg-gray-300' : 'bg-orange-500'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Submit Review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
