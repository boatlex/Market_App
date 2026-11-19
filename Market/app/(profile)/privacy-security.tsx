import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/authContext';

const PRIVACY_STORAGE_KEY = 'user_privacy_preferences';

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

const PrivacyScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [prefs, setPrefs] = useState<PrivacyPreferences>(DEFAULT_PREFS);
  const [infoModal, setInfoModal] = useState<'safety' | 'privacy' | 'terms' | null>(null);

  // Load saved privacy preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const saved = await AsyncStorage.getItem(PRIVACY_STORAGE_KEY);
        if (saved) {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.error('Failed to load privacy preferences:', error);
      }
    };
    loadPrefs();
  }, []);

  const togglePref = async (key: keyof PrivacyPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await AsyncStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save privacy preference:', error);
    }
  };

  return (
    <SafeScreen>
      <Header title="Privacy & Security" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Security Overview & Password Shortcut */}
        <View className="bg-white mx-4 rounded-3xl p-5 shadow-sm mb-5">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Account Security
          </Text>

          <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center">
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View>
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
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="key-outline" size={18} color="#2563EB" />
              </View>
              <View>
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
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
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
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={22} color="#F59E0B" />
              <Text className="text-sm font-semibold text-gray-900">
                Marketplace Safety Guidelines
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setInfoModal('privacy')}
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="document-lock-outline" size={22} color="#2563EB" />
              <Text className="text-sm font-semibold text-gray-900">
                Privacy Policy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setInfoModal('terms')}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="reader-outline" size={22} color="#374151" />
              <Text className="text-sm font-semibold text-gray-900">
                Terms of Service
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Info Modal for Safety Tips / Privacy Policy / Terms */}
      <Modal
        visible={infoModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setInfoModal(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">
                {infoModal === 'safety'
                  ? 'Marketplace Safety Tips'
                  : infoModal === 'privacy'
                  ? 'Privacy Policy'
                  : 'Terms of Service'}
              </Text>
              <TouchableOpacity onPress={() => setInfoModal(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {infoModal === 'safety' && (
                <View className="gap-3">
                  <SafetyTip
                    title="Meet in Public Places"
                    body="Always inspect products and complete handovers in busy, well-lit public locations."
                  />
                  <SafetyTip
                    title="Inspect Before Paying"
                    body="Never send Mobile Money deposits or advance fees before inspecting an item or verifying a service provider."
                  />
                  <SafetyTip
                    title="Keep Conversations In-App"
                    body="Chat inside the app so our moderation team can assist if you ever need to file a report."
                  />
                  <SafetyTip
                    title="Report Suspicious Listings"
                    body="Use the Report button on any listing, job, or profile that asks for upfront application fees or behaves suspiciously."
                  />
                </View>
              )}
              {infoModal === 'privacy' && (
                <Text className="text-sm text-gray-600 leading-6">
                  We collect only the account, location (region & district), and listing details needed to connect buyers, sellers, service providers, and job seekers across Ghana. Your password is encrypted, and you can permanently erase your account and all uploaded media at any time from Settings.
                </Text>
              )}

              {infoModal === 'terms' && (
                <Text className="text-sm text-gray-600 leading-6">
                  By using this marketplace, you agree to post accurate listings, respect other members, and refrain from fraudulent or prohibited items. Accounts that violate community guidelines may have listings removed or access suspended.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setInfoModal(null)}
              className="mt-6 bg-blue-600 py-3.5 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-sm">Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
};

function PrivacyToggleRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  isLast = false,
}: {
  icon: any;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        <Ionicons name={icon} size={20} color="#4B5563" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">{title}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
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
}

function SafetyTip({ title, body }: { title: string; body: string }) {
  return (
    <View className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5">
      <Text className="text-sm font-bold text-gray-900 mb-1">{title}</Text>
      <Text className="text-xs text-gray-600 leading-5">{body}</Text>
    </View>
  );
}

export default PrivacyScreen;
