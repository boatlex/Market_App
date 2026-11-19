import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedbackItem, FeedbackStatus, ReviewRating } from '../../types';

interface AdminFeedbackCardProps {
  item: FeedbackItem;
  onUpdateStatus: (feedbackId: string, nextStatus: FeedbackStatus) => void;
  isUpdating: boolean;
  updatingStatus?: FeedbackStatus | null;
}

const STATUS_STYLES: Record<
  FeedbackStatus,
  { bg: string; text: string; label: string }
> = {
  new: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'New' },
  reviewed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Reviewed' },
  resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Resolved' },
};

const STARS: ReviewRating[] = Array.from({ length: 5 }, (_, i) => (i + 1) as ReviewRating);


export default function AdminFeedbackCard({
  item,
  onUpdateStatus,
  isUpdating,
  updatingStatus
}: AdminFeedbackCardProps) {
  const sender = typeof item.user === 'object' ? item.user : null;
  const senderName = sender
    ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'User'
    : 'Marketplace User';

  const statusBadge = STATUS_STYLES[item.status] || STATUS_STYLES.new;

  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isMarkingReviewed = isUpdating && updatingStatus === 'reviewed';
  const isMarkingResolved = isUpdating && updatingStatus === 'resolved';

  return (
    <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-3 shadow-sm">
      {/* Category & Status Badge */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="bg-gray-100 px-2.5 py-1 rounded-full">
          <Text className="text-[11px] font-semibold text-gray-700">
            {item.category}
          </Text>
        </View>

        <View className={`px-2.5 py-1 rounded-full ${statusBadge.bg}`}>
          <Text className={`text-[11px] font-bold ${statusBadge.text}`}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      {/* Subject */}
      <Text className="text-base font-bold text-gray-900 mb-1">
        {item.subject}
      </Text>

      {/* Star Rating & Date */}
      <View className="flex-row items-center mb-2.5">
        {STARS.map((star) => (
          <Ionicons
            key={star}
            name={star <= item.rating ? 'star' : 'star-outline'}
            size={14}
            color={star <= item.rating ? '#F59E0B' : '#D1D5DB'}
          />
        ))}
        <Text className="text-xs text-gray-400 ml-2">• {formattedDate}</Text>
      </View>

      {/* Message Body */}
      <Text className="text-sm text-gray-700 leading-5 bg-gray-50 p-3 rounded-xl mb-3">
        {item.message}
      </Text>

      {/* Sender Info */}
      <View className="flex-row items-center justify-between border-t border-gray-100 pt-2.5 mb-3">
        <View className="flex-row items-center">
          <Ionicons name="person-circle-outline" size={18} color="#6B7280" />
          <Text className="text-xs font-semibold text-gray-800 ml-1.5">
            {senderName}
          </Text>
        </View>
        {sender?.email && (
          <Text className="text-xs text-gray-400">{sender.email}</Text>
        )}
      </View>

            {/* Action Buttons */}
      <View className="flex-row gap-2">
        {item.status !== 'reviewed' && (
          <TouchableOpacity
            disabled={isUpdating}
            activeOpacity={0.75}
            onPress={() => onUpdateStatus(item._id, 'reviewed')}
            className={`flex-1 bg-blue-50 border border-blue-200 py-2.5 rounded-xl items-center ${
              isUpdating && !isMarkingReviewed ? 'opacity-50' : ''
            }`}
          >
            {isMarkingReviewed ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text className="text-xs font-bold text-blue-700">
                Mark Reviewed
              </Text>
            )}
          </TouchableOpacity>
        )}

        {item.status !== 'resolved' && (
          <TouchableOpacity
            disabled={isUpdating}
            activeOpacity={0.75}
            onPress={() => onUpdateStatus(item._id, 'resolved')}
            className={`flex-1 bg-emerald-600 py-2.5 rounded-xl items-center ${
              isUpdating && !isMarkingResolved ? 'opacity-50' : ''
            }`}
          >
            {isMarkingResolved ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-xs font-bold text-white">
                Mark Resolved
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
