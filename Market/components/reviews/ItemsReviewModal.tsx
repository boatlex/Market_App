import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewRating } from '../../types';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; comment?: string }) => void;
  isSubmitting: boolean;
  title?: string;
}

const STARS: ReviewRating[] = Array.from(
  { length: 5 },
  (_, i) => (i + 1) as ReviewRating
);

export default function WriteReviewModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  title = 'Rate & Review',
}: WriteReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  // Reset form fields whenever the modal closes
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
    }
  }, [visible]);

  const handlePressSubmit = () => {
    if (rating === 0) {
      Alert.alert('Select Rating', 'Please tap a star rating from 1 to 5.');
      return;
    }

    onSubmit({
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <View
        style={{ paddingBottom: keyboardHeight }}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-white rounded-t-3xl max-h-[85%]">
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, paddingBottom: 36 }}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">{title}</Text>
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Interactive Star Selector */}
            <Text className="text-xs font-semibold text-gray-500 text-center mb-2">
              Tap to rate your experience
            </Text>
            <View className="flex-row justify-center gap-3 mb-5">
              {STARS.map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  className="p-1"
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Comment */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-semibold text-gray-600">
                Comment (Optional)
              </Text>
              <Text className="text-[11px] text-gray-400">
                {comment.length}/500
              </Text>
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              maxLength={500}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
              placeholder="Share helpful details for other members..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"              
              submitBehavior="blurAndSubmit"
              style={{ minHeight: 100 }}
              className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-5"
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handlePressSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
              className={`py-3.5 rounded-xl mb-6 items-center ${
                isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-sm">Post Review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
