import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqCategory = 'All' | 'Marketplace' | 'Services' | 'Jobs' | 'Safety & Account';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'All'>;
  question: string;
  answer: string;
}

const CATEGORIES: FaqCategory[] = [
  'All',
  'Marketplace',
  'Services',
  'Jobs',
  'Safety & Account',
];

const FAQ_DATA: FaqItem[] = [
  // Marketplace (Products)
  {
    id: 'm1',
    category: 'Marketplace',
    question: 'How do I post a product for sale?',
    answer:
      'Tap the Sell or Post button on the bottom navigation bar, choose Product, upload clear photos, set your price in GHS, select your Region and District, and submit. Your listing appears immediately in the marketplace feed.',
  },
  {
    id: 'm2',
    category: 'Marketplace',
    question: 'How do I mark my product as sold or unavailable?',
    answer:
      'Go to Profile > My Ads (or My Listings), select the item you sold, and toggle its availability status off so buyers know it is no longer available.',
  },
  {
    id: 'm3',
    category: 'Marketplace',
    question: 'How do I pay for an item on the app?',
    answer:
      'Buyers and sellers arrange payment directly—usually via Cash on Delivery or Mobile Money (MTN MoMo, Telecel Cash, ATMoney) after inspecting the item in person.',
  },

  // Services
  {
    id: 's1',
    category: 'Services',
    question: 'How can I offer my skills as a Service Provider?',
    answer:
      'Create a Service Provider profile with your business name, trade category, pricing rate (per hour, per day, or fixed project), portfolio images, and your Ghana phone or WhatsApp number.',
  },
  {
    id: 's2',
    category: 'Services',
    question: 'What does the Verified badge on a Service Provider mean?',
    answer:
      'A verified badge indicates our admin team has reviewed and confirmed the provider’s identity and business details. Always check reviews and ratings before hiring.',
  },
  {
    id: 's3',
    category: 'Services',
    question: 'Can I pause my service listing when I am fully booked?',
    answer:
      'Yes. You can switch your availability status between Available, Busy, or Away at any time so clients know when you are taking new jobs.',
  },

  // Jobs & Job Seekers
  {
    id: 'j1',
    category: 'Jobs',
    question: 'How do I apply for a job listing?',
    answer:
      'Open any job post to view the requirements, work mode (On-site, Remote, or Hybrid), and salary range. Tap Apply to submit your Job Seeker profile or contact the employer using their listed phone or email.',
  },
  {
    id: 'j2',
    category: 'Jobs',
    question: 'How do employers find my Job Seeker profile?',
    answer:
      'Complete your Job Seeker profile with your headline, skills, work experience, education, and CV/resume. Keep "Searching for Job" enabled so employers in Ghana and Outside Ghane can discover you.',
  },
  {
    id: 'j3',
    category: 'Jobs',
    question: 'Should I ever pay a fee to apply for a job?',
    answer:
      'No. Legitimate employers will never ask you to pay an application, registration, or interview fee. Report any job asking for money immediately using the Report button.',
  },

  // Safety & Account
  {
    id: 'sa1',
    category: 'Safety & Account',
    question: 'How do I stay safe when meeting a buyer or seller?',
    answer:
      'Always meet in busy, well-lit public places (such as a mall, fuel station, or bank forecourt). Inspect items thoroughly before sending Mobile Money or handing over cash.',
  },
  {
    id: 'sa2',
    category: 'Safety & Account',
    question: 'How do I report a scam, fake listing, or abusive user?',
    answer:
      'Tap the Report icon on any product, service, job, or user profile. Choose a reason and submit—our moderation team reviews all pending reports promptly. You can track your reports under Profile > My Reports.',
  },
  {
    id: 'sa3',
    category: 'Safety & Account',
    question: 'How do I update my profile photo, password, or delete my account?',
    answer:
      'Tap Edit on your Profile card to change your name or profile picture. To change your password, go to Settings > Account Settings. To permanently delete your account, go to Settings > Danger Zone.',
  },
];

const FaqScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('All');
  const [expandedId, setExpandedId] = useState<string | null>('m1');

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [search, selectedCategory]);

  const toggleItem = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeScreen>
      <Header title="FAQ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro Banner */}
        <View className="mx-4 mb-4">
          <Text className="text-xl font-bold text-gray-900">
            How can we help you?
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Find quick answers about buying, selling, services, and jobs.
          </Text>
        </View>

        {/* Search Input */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl mx-4 px-3.5 py-2.5 mb-3 shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search questions (e.g. MoMo, jobs, report)..."
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            className="flex-1 ml-2.5 text-sm text-gray-900"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="mb-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.75}
                className={`px-4 py-2 rounded-full border ${
                  active
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQ Accordion List */}
        <View className="mx-4">
          {filteredFaqs.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 items-center border border-gray-100">
              <Ionicons name="help-circle-outline" size={36} color="#9CA3AF" />
              <Text className="text-sm font-bold text-gray-800 mt-2">
                No matching questions found
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1">
                Try another keyword or clear your search filter.
              </Text>
            </View>
          ) : (
            filteredFaqs.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <View
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden shadow-sm"
                >
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => toggleItem(item.id)}
                    className="p-4 flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                        {item.category}
                      </Text>
                      <Text className="text-sm font-bold text-gray-900 leading-5">
                        {item.question}
                      </Text>
                    </View>
                                        <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center">
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#374151"
                      />
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/60">
                      <Text className="text-xs text-gray-600 leading-5">
                        {item.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Still Need Help Card */}
        <View className="bg-blue-50 border border-blue-100 rounded-3xl mx-4 mt-4 p-5">
          <View className="flex-row items-center mb-2">
            <Ionicons name="chatbubble-ellipses" size={20} color="#2563EB" />
            <Text className="text-base font-bold text-gray-900 ml-2">
              Still have questions?
            </Text>
          </View>
          <Text className="text-xs text-gray-600 leading-5 mb-4">
            Send us your feedback or reach out to our support team and we will get back to you shortly.
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(profile)/feedback')}
              className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Send Feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL('mailto:support@ghmarket.app')}
              className="flex-1 bg-white border border-blue-200 py-3 rounded-xl items-center"
            >
              <Text className="text-blue-700 font-bold text-xs">Email Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default FaqScreen;
