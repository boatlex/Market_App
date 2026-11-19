import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/authContext';
import { useItemReviews } from '../../hooks/useItemReviews';
import { ItemReview, ReportTargetType } from '../../types';
import { StarRating } from './serviceRatings';
import ItemsReviewModal from './ItemsReviewModal';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ItemReviewsSectionProps {
  targetId: string;
  targetType: ReportTargetType;
  averageRating?: number;
  totalReviewsCount?: number;
  isOwner?: boolean;
  title?: string;
  defaultExpanded?: boolean;
}


export default function ItemReviewsSection({
  targetId,
  targetType,
  averageRating = 0,
  totalReviewsCount,
  isOwner = false,
  title = 'Reviews & Ratings',
  defaultExpanded = false,
}: ItemReviewsSectionProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [page, setPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    reviews,
    totalReviews,
    totalPages,
    currentPage,
    isLoading,
    addItemReview,
    isAddingItemReview,
    deleteItemReview,
    isDeletingItemReview,
  } = useItemReviews(targetId, targetType, page, 10);

  const currentUserId = user?._id || user?.id;

  const handleToggleSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  const handleOpenModal = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)') },
      ]);
      return;
    }
    setIsModalVisible(true);
  };

  const handleSubmitReview = (payload: { rating: number; comment?: string }) => {
    addItemReview(payload, {
      onSuccess: () => {
        setIsModalVisible(false);
        setPage(1);
        setIsExpanded(true);
      },
      onError: (error: any) => {
        Alert.alert(
          'Unable to Post Review',
          error?.response?.data?.message ||
            error?.message ||
            'Could not submit your review.'
        );
      },
    });
  };

  const handleConfirmDelete = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to remove this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItemReview(reviewId),
        },
      ]
    );
  };

    const displayCount =
    totalReviews > 0
      ? totalReviews
      : reviews.length > 0
      ? reviews.length
      : totalReviewsCount ?? 0;

  const computedAverage =
    averageRating > 0
      ? averageRating
      : reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <View className="bg-white rounded-3xl p-5 border border-gray-100 mt-4">
      {/* Collapsible Header Bar */}
      <TouchableOpacity
        onPress={handleToggleSection}
        activeOpacity={0.75}
        className="flex-row items-center justify-between"
      >
            <View className="flex-row items-center gap-1.5 mt-1">
            <StarRating rating={computedAverage} isReadOnly size={15} />
            <Text className="text-xs font-bold text-gray-800">
              {computedAverage.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-400">
              ({displayCount} {displayCount === 1 ? 'review' : 'reviews'})
            </Text>
          </View>


        <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#374151"
          />
        </View>
      </TouchableOpacity>

      {/* Expandable Content */}
      {isExpanded && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          {/* Write Review Action Row */}
          {!isOwner && (
            <TouchableOpacity
              onPress={handleOpenModal}
              activeOpacity={0.8}
              className="flex-row items-center justify-center bg-blue-600 py-2.5 px-4 rounded-xl mb-4"
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-1.5">
                Write a Review
              </Text>
            </TouchableOpacity>
          )}

          {/* Reviews List */}
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" className="my-6" />
          ) : reviews.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-100">
              <Ionicons
                name="chatbox-ellipses-outline"
                size={28}
                color="#9CA3AF"
              />
              <Text className="text-sm font-semibold text-gray-700 mt-2">
                No reviews yet
              </Text>
              <Text className="text-xs text-gray-400 text-center mt-0.5">
                {isOwner
                  ? 'Customer reviews will appear here.'
                  : 'Be the first to share your experience!'}
              </Text>
            </View>
          ) : (
            <View>
              {reviews.map((review: ItemReview, index: number) => {
                const reviewer =
                  typeof review.reviewer === 'object' ? review.reviewer : null;
                const reviewerId = reviewer?._id || (review.reviewer as string);
                const reviewerName = reviewer
                  ? `${reviewer.firstName || ''} ${
                      reviewer.lastName || ''
                    }`.trim() || 'Member'
                  : 'Marketplace Member';
                const initials = `${reviewer?.firstName?.[0] || ''}${
                  reviewer?.lastName?.[0] || ''
                }`.toUpperCase();

                const canDelete =
                  Boolean(currentUserId) &&
                  (String(currentUserId) === String(reviewerId) ||
                    user?.role === 'admin');

                const formattedDate = new Date(
                  review.createdAt
                ).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <View
                    key={review._id}
                    className={`py-3.5 ${
                      index < reviews.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center flex-1 pr-2">
                        {reviewer?.profilePicture ? (
                          <Image
                            source={{ uri: reviewer.profilePicture }}
                            style={{ width: 34, height: 34, borderRadius: 17 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                            <Text className="text-xs font-bold text-emerald-700">
                              {initials || 'U'}
                            </Text>
                          </View>
                        )}

                        <View className="ml-2.5 flex-1">
                          <Text
                            className="text-xs font-bold text-gray-900"
                            numberOfLines={1}
                          >
                            {reviewerName}
                          </Text>
                          <View className="flex-row items-center gap-1.5 mt-0.5">
                            <StarRating
                              rating={review.rating}
                              isReadOnly
                              size={12}
                            />
                            <Text className="text-[11px] text-gray-400">
                              • {formattedDate}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {canDelete && (
                        <TouchableOpacity
                          disabled={isDeletingItemReview}
                          onPress={() => handleConfirmDelete(review._id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          className="p-1.5"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {review.comment ? (
                      <Text className="text-xs text-gray-600 leading-5 mt-1">
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                );
              })}

                           {/* Pagination Footer */}
              {totalPages > 1 && (
                <View className="flex-row justify-between items-center pt-3 mt-2 border-t border-gray-100">
                  <TouchableOpacity
                    disabled={currentPage <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-gray-100"
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        currentPage <= 1 ? 'text-gray-400' : 'text-gray-800'
                      }`}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <Text className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={currentPage >= totalPages}
                    onPress={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100"
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        currentPage >= totalPages
                          ? 'text-gray-400'
                          : 'text-gray-800'
                      }`}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Standalone Write Review Modal */}
      <ItemsReviewModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmitReview}
        isSubmitting={isAddingItemReview}
      />
    </View>
  );
}

