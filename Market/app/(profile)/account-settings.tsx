import React, { ComponentRef, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import AccountOverviewCard from '../../components/profile/AccountOverviewCard';
import PersonalInfoFormCard from '../../components/profile/PersonalInfoFormCard';
import ChangePasswordFormCard from '../../components/profile/ChangePasswordFormCard';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';

const AccountSettingsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(profile)/settings');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <SafeScreen>
      {/* Top Bar with Menu Button */}
      <View className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 pr-3">
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3 p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold text-gray-900"
            numberOfLines={1}
          >
            Account Settings
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsMenuOpen(true)}
          activeOpacity={0.75}
          style={{ width: 42, height: 42 }}
          className="bg-gray-900 rounded-xl items-center justify-center relative"
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-2xl self-center">
            <AccountOverviewCard user={user} />

            <PersonalInfoFormCard
              initialFirstName={user?.firstName}
              initialLastName={user?.lastName}
            />

            <ChangePasswordFormCard onInputFocus={scrollToBottom} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Column Slide-Out Menu Drawer (change side="left" if preferred) */}
      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        side="right"
      />
    </SafeScreen>
  );
};

export default AccountSettingsScreen;
