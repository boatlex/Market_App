import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

interface AdminUserCardProps {
  user: User;
  onToggleVerify: (userId: string) => void;
  isToggling: boolean;
  onDelete: (userId: string) => void;
  isDeleting: boolean;
}

export default function AdminUserCard({
  user,
  onToggleVerify,
  isToggling,
  onDelete,
  isDeleting,
}: AdminUserCardProps) {
  const userId = user._id || user.id || '';
  const isAccountVerified = Boolean(user.verified || user.clerkId);

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete User Account',
      `Permanently delete ${user.firstName} ${user.lastName} and all their listings, services, and uploaded files?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete User', style: 'destructive', onPress: () => onDelete(userId) },
      ]
    );
  };

  return (
    <View className="flex-row items-center bg-white rounded-2xl p-3 mb-2.5 border border-gray-200 gap-2.5">
      <Image
        source={{ uri: user.profilePicture || 'https://placeholder.com' }}
        className="w-12 h-12 rounded-full bg-gray-100"
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-gray-900 flex-shrink" numberOfLines={1}>
            {user.firstName} {user.lastName}
          </Text>
          {isAccountVerified && (
            <Ionicons name="checkmark-circle" size={15} color="#059669" />
          )}
        </View>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {user.email}
        </Text>
        <Text className="text-[11px] text-gray-400 mt-0.5">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        disabled={isToggling || isDeleting || !userId}
        onPress={() => onToggleVerify(userId)}
        className={`px-2.5 py-2 rounded-xl items-center justify-center ${
          isAccountVerified ? 'bg-amber-50' : 'bg-emerald-600'
        }`}
      >
        {isToggling ? (
          <ActivityIndicator
            size="small"
            color={isAccountVerified ? '#D97706' : '#FFFFFF'}
          />
        ) : (
          <Text
            className={`text-xs font-bold ${
              isAccountVerified ? 'text-amber-700' : 'text-white'
            }`}
          >
            {isAccountVerified ? 'Unverify' : 'Verify'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
        disabled={isDeleting || isToggling || !userId}
        onPress={handleConfirmDelete}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : (
          <Ionicons name="trash-outline" size={19} color="#DC2626" />
        )}
      </TouchableOpacity>
    </View>
  );
}
