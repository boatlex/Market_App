import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

interface AccountOverviewCardProps {
  user: User | null;
}

export default function AccountOverviewCard({ user }: AccountOverviewCardProps) {
  return (
    <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-5">
      <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
        Account Overview
      </Text>

      <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
        <Text className="text-sm text-gray-500">Email Address</Text>
        <Text
          className="text-sm font-semibold text-gray-900 max-w-[65%]"
          numberOfLines={1}
        >
          {user?.email || 'Not set'}
        </Text>
      </View>

      <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
        <Text className="text-sm text-gray-500">Account Role</Text>
        <Text className="text-sm font-semibold text-gray-900 capitalize">
          {user?.role || 'user'}
        </Text>
      </View>

      <View className="flex-row items-center justify-between pt-3">
        <Text className="text-sm text-gray-500">Verification Status</Text>
        <View
          className={`flex-row items-center px-2.5 py-1 rounded-full ${
            user?.verified ? 'bg-emerald-50' : 'bg-amber-50'
          }`}
        >
          <Ionicons
            name={user?.verified ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={user?.verified ? '#10B981' : '#F59E0B'}
          />
          <Text
            className={`text-xs font-semibold ml-1 ${
              user?.verified ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {user?.verified ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
      </View>
    </View>
  );
}
