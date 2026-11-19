import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChangePassword } from '../../hooks/useChangePassword';

interface ChangePasswordFormCardProps {
  onInputFocus?: () => void;
}

export default function ChangePasswordFormCard({
  onInputFocus,
}: ChangePasswordFormCardProps) {
  const {
    changePasswordAsync,
    isChangingPassword,
    changePasswordError,
    resetChangePasswordState,
  } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleUpdatePassword = async () => {
    resetChangePasswordState();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    try {
      const res = await changePasswordAsync({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Success', res.message || 'Password changed successfully!');
    } catch (error: any) {
      Alert.alert(
        'Password Error',
        error?.response?.data?.message || 'Could not change your password.'
      );
    }
  };

  return (
    <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Change Password
        </Text>
        <TouchableOpacity
          onPress={() => setShowPasswords((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={showPasswords ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {changePasswordError && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3.5">
          <Text className="text-xs text-red-600 font-medium">
            {changePasswordError}
          </Text>
        </View>
      )}

      <Text className="text-xs font-semibold text-gray-600 mb-1">
        Current Password
      </Text>
      <TextInput
        value={currentPassword}
        onChangeText={setCurrentPassword}
        onFocus={onInputFocus}
        secureTextEntry={!showPasswords}
        placeholder="Enter current password"
        editable={!isChangingPassword}
        className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-3.5"
      />

      <Text className="text-xs font-semibold text-gray-600 mb-1">
        New Password
      </Text>
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        onFocus={onInputFocus}
        secureTextEntry={!showPasswords}
        placeholder="Min 8 chars, letters, numbers & symbol"
        editable={!isChangingPassword}
        className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-3.5"
      />

      <Text className="text-xs font-semibold text-gray-600 mb-1">
        Confirm New Password
      </Text>
      <TextInput
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        onFocus={onInputFocus}
        secureTextEntry={!showPasswords}
        placeholder="Re-enter new password"
        editable={!isChangingPassword}
        className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-5"
      />

      <TouchableOpacity
        onPress={handleUpdatePassword}
        disabled={isChangingPassword}
        activeOpacity={0.8}
        className={`py-3.5 rounded-xl items-center ${
          isChangingPassword ? 'bg-blue-400' : 'bg-blue-600'
        }`}
      >
        {isChangingPassword ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-sm">Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
