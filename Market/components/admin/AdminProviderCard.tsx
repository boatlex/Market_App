import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceProvider } from '../../types';

interface AdminProviderCardProps {
  provider: ServiceProvider;
  onToggleVerify: (providerId: string) => void;
  isToggling: boolean;
  onDelete: (providerId: string) => void;
  isDeleting: boolean;
}

export default function AdminProviderCard({
  provider,
  onToggleVerify,
  isToggling,
  onDelete,
  isDeleting,
}: AdminProviderCardProps) {
  const ownerName =
    typeof provider.user === 'object' && provider.user !== null
      ? `${provider.user.firstName} ${provider.user.lastName}`
      : 'Provider';

  const avatarUri =
    Array.isArray(provider.portfolioImages) && provider.portfolioImages.length > 0
      ? provider.portfolioImages[0]
      : 'https://placeholder.com';

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Service Provider',
      `Permanently remove "${provider.businessName}" and all portfolio images?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(provider._id) },
      ]
    );
  };

  return (
    <View className="flex-row items-center bg-white rounded-2xl p-3 mb-2.5 border border-gray-200 gap-2.5">
      <Image source={{ uri: avatarUri }} className="w-14 h-14 rounded-xl bg-gray-100" />

      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-bold text-gray-900 flex-shrink" numberOfLines={1}>
            {provider.businessName}
          </Text>
          {provider.isVerifiedProvider && (
            <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
          )}
        </View>

        <Text className="text-xs text-gray-600 mt-0.5" numberOfLines={1}>
          {provider.category} • {provider.serviceType}
        </Text>

        <Text className="text-[11px] text-gray-400 mt-0.5" numberOfLines={1}>
          By {ownerName} • {provider.region}
        </Text>
      </View>

      <TouchableOpacity
        disabled={isToggling || isDeleting}
        onPress={() => onToggleVerify(provider._id)}
        className={`px-2.5 py-2 rounded-xl items-center justify-center ${
          provider.isVerifiedProvider ? 'bg-amber-50' : 'bg-blue-600'
        }`}
      >
        {isToggling ? (
          <ActivityIndicator
            size="small"
            color={provider.isVerifiedProvider ? '#D97706' : '#FFFFFF'}
          />
        ) : (
          <Text
            className={`text-xs font-bold ${
              provider.isVerifiedProvider ? 'text-amber-700' : 'text-white'
            }`}
          >
            {provider.isVerifiedProvider ? 'Unverify' : 'Verify'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
        disabled={isDeleting || isToggling}
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
