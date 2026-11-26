import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';

const BASE_PRIVACY_STORAGE_KEY = 'user_privacy_preferences';

interface PrivacyPreferences {
  showPhoneNumber: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
}

const DEFAULT_PREFS: PrivacyPreferences = {
  showPhoneNumber: true,
  showOnlineStatus: true,
  allowDirectMessages: true,
};

interface PrivacyToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

const PrivacyToggleRow = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  isLast = false,
}: PrivacyToggleRowProps) => (
  <View
    className={`flex-row items-center justify-between py-3.5 ${
      !isLast ? 'border-b border-gray-100' : ''
    }`}
  >
    <View className="flex-row items-center gap-3 flex-1 pr-4">
      <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center shrink-0">
        <Ionicons name={icon} size={18} color="#374151" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-500 mt-0.5 leading-4">{subtitle}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
      thumbColor={value ? '#2563EB' : '#F3F4F6'}
    />
  </View>
);

const PrivacyScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const isAdmin = user?.role === 'admin';

  const storageKey = user?._id
    ? `${BASE_PRIVACY_STORAGE_KEY}_${user._id}`
    : BASE_PRIVACY_STORAGE_KEY;

  const [prefs, setPrefs] = useState<PrivacyPreferences>(DEFAULT_PREFS);
  const [infoModal, setInfoModal] = useState<'safety' | 'privacy' | 'terms' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(profile)/settings');
    }
  };

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
        } else {
          setPrefs(DEFAULT_PREFS);
        }
      } catch (error) {
        console.error('Failed to load privacy preferences:', error);
      }
    };
    loadPrefs();
  }, [storageKey]);

  const togglePref = async (key: keyof PrivacyPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save privacy preference:', error);
    }
  };

  const getModalContent = () => {
    if (infoModal === 'safety') {
      return {
        title: 'Marketplace Safety Guidelines',
        body: '• Meet in well-lit, public locations when inspecting items in person.\n• Never send advance payments or deposits before verifying the product or service.\n• Keep conversations inside the app so our team can assist if a dispute arises.\n• Report suspicious listings or accounts immediately.',
      };
    }
    if (infoModal === 'privacy') {
      return {
        title: 'Privacy Policy',
        body: 'We only collect information required to run your marketplace account, facilitate buyer-seller communication, and keep the platform secure. Your contact details are only shared according to your Marketplace Privacy toggles.',
      };
    }
    if (infoModal === 'terms') {
      return {
        title: 'Terms of Service',
        body: 'By using this marketplace, you agree to list accurate items and services, respect other community members, and comply with all local laws. Fraudulent listings or harassment will result in immediate account suspension.',
      };
    }
    return { title: '', body: '' };
  };

  const modalContent = getModalContent();

  return (
    <SafeScreen>
      <View
        className="flex-1 bg-gray-50 overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
      >
        {/* Top Bar with Back & Menu Toggle Button */}
        <View className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
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
              Privacy & Security
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

        {/* Full-Width ScrollView so Desktop Scrollbar Sits Flush on Right Edge */}
        <ScrollView
          className="flex-1 w-full"
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingTop: 16,
            paddingBottom: 80,
          }}
        >
          {/* Centered Desktop Column */}
          <View className="w-full max-w-2xl self-center">
            {/* 1. Security Overview & Password Shortcut */}
            <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-5">
              <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Account Security
              </Text>

              <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center">
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      Account Protection
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {user?.verified ? 'Verified account active' : 'Email verification pending'}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-2.5 py-1 rounded-full ${
                    user?.verified ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      user?.verified ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {user?.verified ? 'Protected' : 'Unverified'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/(profile)/account-settings')}
                className="flex-row items-center justify-between pt-3.5"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
                    <Ionicons name="key-outline" size={18} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      Change Password
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Update your login credentials
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* 2. Privacy Controls */}
            <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-5">
              <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Marketplace Privacy
              </Text>
              <PrivacyToggleRow
                icon="call-outline"
                title="Display Phone Number"
                subtitle="Allow buyers & employers to view your phone number on posts"
                value={prefs.showPhoneNumber}
                onToggle={() => togglePref('showPhoneNumber')}
              />

              <PrivacyToggleRow
                icon="radio-button-on-outline"
                title="Show Online Status"
                subtitle="Let other members see when you are active in messages"
                value={prefs.showOnlineStatus}
                onToggle={() => togglePref('showOnlineStatus')}
              />

              <PrivacyToggleRow
                icon="chatbubbles-outline"
                title="Allow Direct Messages"
                subtitle="Receive inquiries about your products, services & profile"
                value={prefs.allowDirectMessages}
                onToggle={() => togglePref('allowDirectMessages')}
                isLast
              />
            </View>

            {/* 3. Trust, Safety & Policies */}
            <View className="bg-white mx-4 rounded-3xl p-2 shadow-sm mb-6">
              <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-3 ml-3 mb-1">
                Safety & Legal
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setInfoModal('safety')}
                className="flex-row items-center justify-between p-3.5 border-b border-gray-100"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-full bg-amber-50 items-center justify-center">
                    <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    Marketplace Safety Guidelines
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setInfoModal('privacy')}
                className="flex-row items-center justify-between p-3.5 border-b border-gray-100"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                    <Ionicons name="document-text-outline" size={18} color="#374151" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    Privacy Policy
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setInfoModal('terms')}
                className="flex-row items-center justify-between p-3.5"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                    <Ionicons name="reader-outline" size={18} color="#374151" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    Terms of Service
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Info Policy Modal */}
        <Modal
          visible={Boolean(infoModal)}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoModal(null)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="w-full max-w-md bg-white rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-900 flex-1 pr-2">
                  {modalContent.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setInfoModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#374151" />
                </TouchableOpacity>
              </View>

              <Text className="text-sm text-gray-600 leading-6 mb-5">
                {modalContent.body}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setInfoModal(null)}
                className="bg-gray-900 py-3 rounded-xl items-center"
              >
                <Text className="text-white text-sm font-bold">Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Column Slide-Out Menu Drawer */}
        <ProfileMenuDrawer
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isAdmin={isAdmin}
          unreadCount={unreadCount}
          side="right"
        />
      </View>
    </SafeScreen>
  );
};

export default PrivacyScreen;

