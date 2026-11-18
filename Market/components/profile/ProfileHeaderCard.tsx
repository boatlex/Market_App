import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';

interface ProfileHeaderCardProps {
  user: User | null;
}

export default function ProfileHeaderCard({ user }: ProfileHeaderCardProps) {
  const { updateProfileAsync, isUpdatingProfile } = useUpdateProfile();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [previewUri, setPreviewUri] = useState(user?.profilePicture || '');

  const openEditModal = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setPreviewUri(user?.profilePicture || '');
    setIsEditModalOpen(true);
  };

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access in your settings to choose a profile photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect:[1,1],
      quality: 0.75,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter both your first and last name.');
      return;
    }

    try {
      await updateProfileAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePictureUri: previewUri,
      });
      setIsEditModalOpen(false);
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error?.response?.data?.message || error?.message || 'Could not update your profile.'
      );
    }
  };

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
      : 'Alex Morgan';

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  const joinedLabel = user?.createdAt
    ? `Joined ${new Date(user.createdAt).toLocaleDateString('en-GH', {
        month: 'long',
        year: 'numeric',
      })}`
    : 'Joined October 2026';

  return (
    <>
      <View className="bg-white items-center pt-8 pb-6 px-4 shadow-sm rounded-b-[40px] relative">
        {/* Top-Right Edit Button */}
        <TouchableOpacity
          onPress={openEditModal}
          activeOpacity={0.75}
          className="absolute top-4 right-5 flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full"
        >
          <Ionicons name="create-outline" size={15} color="#374151" />
          <Text className="text-xs font-semibold text-gray-700 ml-1">Edit</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openEditModal}
          className="relative"
          style={{ width: 84, height: 84 }}
        >
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                borderWidth: 4,
                borderColor: '#10B981',
              }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                borderWidth: 4,
                borderColor: '#10B981',
              }}
              className="bg-emerald-50 items-center justify-center"
            >
              <Text className="text-2xl font-bold text-emerald-700">
                {initials || 'U'}
              </Text>
            </View>
          )}

          <View className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-white">
            <Ionicons name="camera" size={13} color="white" />
          </View>
        </TouchableOpacity>

        {/* Full Name */}
        <Text className="text-2xl font-bold text-black mt-3">{fullName}</Text>

        {/* Join Date */}
        <Text className="text-gray-400 font-medium text-sm mt-0.5">
          {joinedLabel}
        </Text>

        {/* Reputation Stars */}
        <View className="flex-row items-center mt-2.5 bg-gray-100 px-3 py-1 rounded-full">
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text className="text-black font-semibold text-sm ml-1">4.9</Text>
          <Text className="text-gray-400 text-xs ml-1">(48 reviews)</Text>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isUpdatingProfile) setIsEditModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/50 justify-end"
        >
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
              <TouchableOpacity
                disabled={isUpdatingProfile}
                onPress={() => setIsEditModalOpen(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Avatar Preview inside Modal */}
            <View className="items-center mb-5">
              <TouchableOpacity
                onPress={handleChoosePhoto}
                disabled={isUpdatingProfile}
                activeOpacity={0.8}
              >
                {previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 42,
                      borderWidth: 3,
                      borderColor: '#10B981',
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 42,
                      borderWidth: 3,
                      borderColor: '#10B981',
                    }}
                    className="bg-emerald-50 items-center justify-center"
                  >
                    <Ionicons name="person" size={34} color="#059669" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChoosePhoto}
                disabled={isUpdatingProfile}
                className="mt-2.5 bg-blue-50 px-3.5 py-1.5 rounded-full"
              >
                <Text className="text-xs font-semibold text-blue-600">
                  Change Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* First Name Input */}
            <Text className="text-xs font-semibold text-gray-600 mb-1">First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              editable={!isUpdatingProfile}
              placeholder="Enter first name"
              className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-4"
            />

            {/* Last Name Input */}
            <Text className="text-xs font-semibold text-gray-600 mb-1">Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              editable={!isUpdatingProfile}
              placeholder="Enter last name"
              className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 mb-6"
            />

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isUpdatingProfile}
              activeOpacity={0.8}
              className={`py-3.5 rounded-xl items-center ${
                isUpdatingProfile ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-sm">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
