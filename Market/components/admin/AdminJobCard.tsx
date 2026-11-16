import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../../types';

interface AdminJobCardProps {
  job: Job;
  onDelete: (jobId: string) => void;
  isDeleting: boolean;
}

export default function AdminJobCard({ job, onDelete, isDeleting }: AdminJobCardProps) {
  const imageUri = job.companyLogo || job.jobImage || 'https://placeholder.com';

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Job Listing',
      `Are you sure you want to permanently remove "${job.title}" at ${job.companyName}? This will also delete its uploaded images.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(job._id),
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center bg-white rounded-2xl p-3 mb-2.5 border border-gray-200 gap-3">
      <Image source={{ uri: imageUri }} className="w-14 h-14 rounded-xl bg-gray-100" />

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-bold text-gray-900 flex-shrink" numberOfLines={1}>
            {job.title}
          </Text>
          <View
            className={`px-1.5 py-0.5 rounded ${
              job.isOpen ? 'bg-emerald-50' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-[9px] font-bold ${
                job.isOpen ? 'text-emerald-700' : 'text-gray-600'
              }`}
            >
              {job.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <Text className="text-xs font-semibold text-blue-600 mt-0.5" numberOfLines={1}>
          {job.companyName} • {job.workMode}
        </Text>

        <Text className="text-[11px] text-gray-500 mt-0.5" numberOfLines={1}>
          {job.category} • {job.region}
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
