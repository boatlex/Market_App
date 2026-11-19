import React, { ComponentRef, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import {
  useSubmitFeedback,
  FeedbackCategory,
  ReviewRating,
} from '../../hooks/useSubmitFeedback';

const FEEDBACK_CATEGORIES: { key: FeedbackCategory; icon: any }[] = [
  { key: 'General Feedback', icon: 'chatbubble-outline' },
  { key: 'Feature Request', icon: 'bulb-outline' },
  { key: 'Bug Report', icon: 'bug-outline' },
  { key: 'Account & Billing', icon: 'person-circle-outline' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

const STARS: ReviewRating[] = Array.from(
  { length: 5 },
  (_, i) => (i + 1) as ReviewRating
);

const FeedbackScreen = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { submitFeedbackAsync, isSubmittingFeedback } = useSubmitFeedback();

  const [category, setCategory] = useState<FeedbackCategory>('General Feedback');
  const [rating, setRating] = useState<ReviewRating>(5);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const scrollToForm = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        'Incomplete Form',
        'Please enter both a subject and your feedback message.'
      );
      return;
    }

    try {
      const res = await submitFeedbackAsync({
        category,
        rating,
        subject: subject.trim(),
        message: message.trim(),
      });

      Alert.alert(
        'Feedback Sent',
        res.message || 'Thank you for helping us improve the marketplace!',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error?.response?.data?.message || 'Could not send feedback. Please try again.'
      );
    }
  };

  return (
    <SafeScreen>
      <Header title="Send Feedback" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Intro */}
          <View className="mx-4 mb-4">
            <Text className="text-xl font-bold text-gray-900">
              We value your feedback
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Report an issue, suggest a new feature, or tell us about your experience.
            </Text>
          </View>

          {/* 1. Star Rating Card */}
          <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-4 items-center">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Rate Your Experience
            </Text>

            <View className="flex-row gap-3 mb-2">
              {STARS.map((star) => {
                const filled = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    className="p-1"
                  >
                    <Ionicons
                      name={filled ? 'star' : 'star-outline'}
                      size={34}
                      color={filled ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-xs font-semibold text-amber-600">
              {RATING_LABELS[rating]}
            </Text>
          </View>

          {/* 2. Category Selector */}
          <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Feedback Category
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((item) => {
                const active = category === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setCategory(item.key)}
                    activeOpacity={0.75}
                    className={`flex-row items-center px-3.5 py-2 rounded-full border ${active
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <Ionicons
                      name={item.icon}
                      size={15}
                      color={active ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      className={`text-xs font-semibold ml-1.5 ${active ? 'text-white' : 'text-gray-700'
                        }`}
                    >
                      {item.key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Subject & Message Form */}
          <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-6">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              Details
            </Text>

            <Text className="text-xs font-semibold text-gray-600 mb-1">Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              onFocus={scrollToForm}
              maxLength={120}
              editable={!isSubmittingFeedback}
              placeholder="Brief summary (e.g. Filter by district on Jobs)"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-4"
            />

            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-semibold text-gray-600">Message</Text>
              <Text className="text-[11px] text-gray-400">{message.length}/1000</Text>
            </View>
            <TextInput
              value={message}
              onChangeText={setMessage}
              onFocus={scrollToForm}
              maxLength={1000}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSubmittingFeedback}
              placeholder="Tell us more details so we can act on your feedback..."
              placeholderTextColor="#9CA3AF"
              style={{ minHeight: 120 }}
              className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-6"
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmittingFeedback}
              activeOpacity={0.8}
              className={`py-3.5 rounded-xl items-center flex-row justify-center ${isSubmittingFeedback ? 'bg-blue-400' : 'bg-blue-600'
                }`}
            >
              {isSubmittingFeedback ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-2">
                    Submit Feedback
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

export default FeedbackScreen;
