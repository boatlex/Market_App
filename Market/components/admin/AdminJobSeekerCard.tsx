import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobSeekerProfile } from '../../types';

interface AdminJobSeekerCardProps {
  seeker: JobSeekerProfile;
  onDelete: (seekerId: string) => void;
  isDeleting: boolean;
}

export default function AdminJobSeekerCard({
  seeker,
  onDelete,
  isDeleting,
}: AdminJobSeekerCardProps) {
  const userObj = typeof seeker.user === 'object' && seeker.user !== null ? seeker.user : null;
  const fullName = userObj ? `${userObj.firstName} ${userObj.lastName}` : 'Job Seeker';
  const avatarUri =
    seeker.profilePicture || userObj?.profilePicture || 'https://placeholder.com';

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Job Seeker Profile',
      `Are you sure you want to permanently remove ${fullName}'s job seeker profile and uploaded resume?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(seeker._id),
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center bg-white rounded-2xl p-3 mb-2.5 border border-gray-200 gap-3">
      <Image source={{ uri: avatarUri }} className="w-12 h-12 rounded-full bg-gray-100" />

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-bold text-gray-900 flex-shrink" numberOfLines={1}>
            {fullName}
          </Text>
          <View
            className={`px-1.5 py-0.5 rounded ${
              seeker.isSearchingForJob ? 'bg-emerald-50' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-[9px] font-bold ${
                seeker.isSearchingForJob ? 'text-emerald-700' : 'text-gray-600'
              }`}
            >
              {seeker.isSearchingForJob ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <Text className="text-xs text-gray-700 mt-0.5" numberOfLines={1}>
          {seeker.professionalHeadline}
        </Text>

        <Text className="text-[11px] text-gray-400 mt-0.5" numberOfLines={1}>
          {seeker.region}
          {seeker.skills?.length > 0 ? ` • ${seeker.skills.slice(0, 3).join(', ')}` : ''}
        </Text>
      </View>

      <TouchableOpacity
        className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
        disabled={isDeleting}
        onPress={handleConfirmDelete}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : (
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        )}
      </TouchableOpacity>
    </View>
  );
}
