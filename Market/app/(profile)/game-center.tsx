import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import useNotifications from '../../hooks/useNotifications';
import ProfileMenuDrawer from '../../components/profile/ProfileMenuDrawer';
import {
  GAME_SITES,
  GAME_CATEGORIES,
  GameCategory,
  GameSite,
} from '../../constants/games/gameSites';
import { GameSiteCard } from '../../components/games/GameSitesCard';

const FAVORITE_GAMES_STORAGE_KEY = 'marketplace_favorite_game_ids';

const GameCenterScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isAdmin = user?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'Pinned'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDesktop = width >= 768;

  // Load saved pinned game IDs on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const raw = window.localStorage.getItem(FAVORITE_GAMES_STORAGE_KEY);
          if (raw) setFavoriteIds(JSON.parse(raw));
          return;
        }
        const saved = await AsyncStorage.getItem(FAVORITE_GAMES_STORAGE_KEY);
        if (saved) setFavoriteIds(JSON.parse(saved));
      } catch {
        // Ignore storage read errors
      }
    };
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (siteId: string) => {
    const updated = favoriteIds.includes(siteId)
      ? favoriteIds.filter((id) => id !== siteId)
      : [siteId, ...favoriteIds];

    setFavoriteIds(updated);

    try {
      const serialized = JSON.stringify(updated);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(FAVORITE_GAMES_STORAGE_KEY, serialized);
        return;
      }
      await AsyncStorage.setItem(FAVORITE_GAMES_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage write errors
    }
  };

  const handleBack = () => {
    const canGoBack =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
        : router.canGoBack();

    if (canGoBack) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return GAME_SITES.filter((site) => {
      const isFav = favoriteIds.includes(site.id);
      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Pinned'
          ? isFav
          : site.category === selectedCategory;

      const matchesSearch =
        !query ||
        site.name.toLowerCase().includes(query) ||
        site.tagline.toLowerCase().includes(query) ||
        site.badge.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      // Always float pinned games to the top when viewing "All" or category tabs
      const aFav = favoriteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteIds.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [selectedCategory, searchQuery, favoriteIds]);

  const handleOpenGameSite = async (site: GameSite) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(site.url, '_blank', 'noopener,noreferrer');
        return;
      }

      const supported = await Linking.canOpenURL(site.url);
      if (supported) {
        await Linking.openURL(site.url);
      } else {
        Alert.alert('Unable to Open', `Could not launch ${site.name}.`);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong while opening the game site.');
    }
  };

  const filterTabs: (GameCategory | 'Pinned')[] = [
    'All',
    'Pinned',
    ...GAME_CATEGORIES.filter((c) => c !== 'All'),
  ];

  return (
    <SafeScreen>
      {/* Top Bar with Back Arrow, Title & ProfileMenuDrawer Toggle */}
      <View className="w-full flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center flex-1 pr-3">
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3 p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text className="text-xl font-extrabold text-gray-900 mr-2">Games</Text>

          {favoriteIds.length > 0 && (
            <View className="bg-rose-50 px-2.5 py-0.5 rounded-full flex-row items-center gap-1">
              <Ionicons name="heart" size={11} color="#E11D48" />
              <Text className="text-[11px] font-bold text-rose-600">
                {favoriteIds.length} pinned
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setIsMenuOpen(true)}
          activeOpacity={0.75}
          style={{ width: 42, height: 42 }}
          className="bg-gray-900 rounded-xl items-center justify-center relative shrink-0"
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-gray-50"
      >
        <View className="w-full max-w-4xl self-center px-4 pt-4">
          {/* Hero Banner */}
          <View className="bg-gray-900 rounded-2xl p-5 mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Marketplace Arcade
              </Text>
              <Text className="text-xl font-extrabold text-white">
                Play Instant & Strategy Games
              </Text>
              <Text className="text-xs text-gray-300 mt-1">
                Explore 25 curated browser, civilization strategy, .io action, puzzle & cloud portals. Tap the heart to pin favorites to the top.
              </Text>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-emerald-500/20 items-center justify-center">
              <Ionicons name="game-controller" size={26} color="#34D399" />
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 mb-3">
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search 25 game portals, civilization, puzzles..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2.5 text-sm text-gray-900"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Pills (Includes "Pinned" tab) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {filterTabs.map((category) => {
              const active = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(category)}
                  className={`px-3.5 py-2 rounded-full border flex-row items-center gap-1 ${
                    active
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {category === 'Pinned' && (
                    <Ionicons
                      name="heart"
                      size={12}
                      color={active ? '#FB7185' : '#E11D48'}
                    />
                  )}
                  <Text
                    className={`text-xs font-bold ${
                      active ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 25 Game Site Cards */}
          <View className="flex-row flex-wrap justify-between">
            {filteredGames.map((site) => (
              <GameSiteCard
                key={site.id}
                site={site}
                isDesktop={isDesktop}
                isFavorite={favoriteIds.includes(site.id)}
                onToggleFavorite={handleToggleFavorite}
                onPress={handleOpenGameSite}
              />
            ))}
          </View>
          {filteredGames.length === 0 && (
            <View className="items-center justify-center py-12">
              <Ionicons
                name={selectedCategory === 'Pinned' ? 'heart-outline' : 'sad-outline'}
                size={36}
                color="#9CA3AF"
              />
              <Text className="text-sm font-bold text-gray-700 mt-2">
                {selectedCategory === 'Pinned'
                  ? 'No pinned games yet'
                  : 'No matching game sites'}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5 text-center px-6">
                {selectedCategory === 'Pinned'
                  ? 'Tap the heart icon on any game card to pin it here for quick access.'
                  : 'Try clearing your search or switching categories.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Profile Menu Drawer */}
      <ProfileMenuDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        unreadCount={unreadCount}
        isAdmin={isAdmin}
      />
    </SafeScreen>
  );
};

export default GameCenterScreen;

