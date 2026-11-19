import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';

interface PersonalInfoFormCardProps {
  initialFirstName?: string;
  initialLastName?: string;
  onInputFocus?: () => void;
}

export default function PersonalInfoFormCard({
  initialFirstName = '',
  initialLastName = '',
  onInputFocus,
}: PersonalInfoFormCardProps) {
  const { updateProfileAsync, isUpdatingProfile } = useUpdateProfile();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const handleSavePersonalInfo = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter both your first and last name.');
      return;
    }

    try {
      await updateProfileAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      Alert.alert('Success', 'Personal information updated.');
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error?.response?.data?.message || 'Could not update personal details.'
      );
    }
  };

  return (
    <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-5">
      <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
        Personal Information
      </Text>

      <Text className="text-xs font-semibold text-gray-600 mb-1">First Name</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        onFocus={onInputFocus}
        placeholder="Enter first name"
        editable={!isUpdatingProfile}
        className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-3.5"
      />

      <Text className="text-xs font-semibold text-gray-600 mb-1">Last Name</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        onFocus={onInputFocus}
        placeholder="Enter last name"
        editable={!isUpdatingProfile}
        className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-5"
      />

      <TouchableOpacity
        onPress={handleSavePersonalInfo}
        disabled={isUpdatingProfile}
        activeOpacity={0.8}
        className={`py-3.5 rounded-xl items-center ${
          isUpdatingProfile ? 'bg-blue-400' : 'bg-blue-600'
        }`}
      >
        {isUpdatingProfile ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-sm">Save Details</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
