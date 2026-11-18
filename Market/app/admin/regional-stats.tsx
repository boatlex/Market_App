import React, { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/authContext';
import { useAdminRegionalStats } from '../../hooks/useAdmin';
import { RegionStat, DistrictStat } from '../../types';
import RefreshButton from '../../components/admin/RefreshButton';
import RegionalSummaryCard from '../../components/admin/RegionalSummaryCard';
import RegionStatCard from '../../components/admin/RegionalStatsCard';

type SortMetric = 'total' | 'products' | 'services' | 'jobs' | 'jobSeekers';

const SORT_OPTIONS: { key: SortMetric; label: string }[] = [
  { key: 'total', label: 'All Activity' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'jobSeekers', label: 'Job Seekers' },
];

// Helper to resolve either active count or all-time count for sorting/filtering
const getMetricValue = (
  item: RegionStat | DistrictStat,
  metric: SortMetric,
  activeOnly: boolean
): number => {
  if (!activeOnly) return item[metric];
  switch (metric) {
    case 'products':
      return item.availableProducts;
    case 'services':
      return item.availableServices;
    case 'jobs':
      return item.openJobs;
    case 'jobSeekers':
      return item.activeJobSeekers;
    case 'total':
    default:
      return (
        item.availableProducts +
        item.availableServices +
        item.openJobs +
        item.activeJobSeekers
      );
  }
};

export default function RegionalStatsScreen() {
  const router = useRouter();
  const { user, isInitializing: isAuthLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortMetric>('total');
  const [activeOnly, setActiveOnly] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useAdminRegionalStats();

  const filteredRegions = useMemo(() => {
    if (!data?.regions) return [];
    const q = search.trim().toLowerCase();

    return data.regions
      .map((region) => {
        // Filter districts by active status if activeOnly is enabled
        const baseDistricts = activeOnly
          ? region.districts.filter((d) => getMetricValue(d, 'total', true) > 0)
          : region.districts;

        const sortedDistricts = [...baseDistricts].sort(
          (a, b) =>
            getMetricValue(b, sortBy, activeOnly) -
            getMetricValue(a, sortBy, activeOnly)
        );

        if (!q) {
          if (activeOnly && getMetricValue(region, 'total', true) === 0) {
            return null;
          }
          return {
            ...region,
            districts: sortedDistricts,
          };
        }

        const regionMatches = region.region.toLowerCase().includes(q);
        const matchingDistricts = sortedDistricts.filter((d) =>
          d.district.toLowerCase().includes(q)
        );

        if (regionMatches) {
          if (activeOnly && getMetricValue(region, 'total', true) === 0) {
            return null;
          }
          return {
            ...region,
            districts: sortedDistricts,
          };
        }

        if (matchingDistricts.length > 0) {
          return {
            ...region,
            districts: matchingDistricts,
          };
        }

        return null;
      })
      .filter((r): r is RegionStat => r !== null)
      .sort(
        (a, b) =>
          getMetricValue(b, sortBy, activeOnly) -
          getMetricValue(a, sortBy, activeOnly)
      );
  }, [data?.regions, search, sortBy, activeOnly]);

  if (isAuthLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (user?.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  const toggleRegion = (regionName: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionName]: !prev[regionName],
    }));
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const headerElement = (
    <View className="mb-3">
      {/* Top Bar */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">Regional Insights</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Distribution across regions & districts
            </Text>
          </View>
        </View>
        <RefreshButton isRefreshing={isRefreshing} onRefresh={handleRefresh} />
      </View>

      {/* National Summary Banner */}
      {data?.summary && (
        <RegionalSummaryCard summary={data.summary} activeOnly={activeOnly} />
      )}

      {/* Search Bar */}
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-3">
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search region or district (e.g. Greater Accra, Kumasi)..."
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
          className="flex-1 ml-2 text-sm text-gray-900"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Active-Only Filter Switch */}
      <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-3.5 py-2 mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold text-gray-900">
            Active & Available Only
          </Text>
          <Text className="text-[11px] text-gray-500">
            Show only available products, services, open jobs & active seekers
          </Text>
        </View>
        <Switch
          value={activeOnly}
          onValueChange={setActiveOnly}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={activeOnly ? '#2563EB' : '#F3F4F6'}
        />
      </View>

      {/* Sort Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="mb-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {SORT_OPTIONS.map((option) => {
          const active = sortBy === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setSortBy(option.key)}
              className={`px-3.5 py-1.5 rounded-full border ${
                active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-white' : 'text-gray-600'
                }`}
              >
                Sort: {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4 pt-2" edges={['top']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-xs text-gray-500 mt-2">
            Loading regional breakdown...
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
          <Text className="text-sm font-semibold text-gray-900 mt-2">
            Failed to load regional data
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-3 bg-blue-600 px-4 py-2 rounded-xl"
          >
            <Text className="text-xs font-semibold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRegions}
          keyExtractor={(item) => item.region || 'unknown'}
          renderItem={({ item }) => (
            <RegionStatCard
              region={item}
              activeOnly={activeOnly}
              isExpanded={search.trim().length > 0 || !!expandedRegions[item.region]}
              onToggle={() => toggleRegion(item.region)}
            />
          )}
          ListHeaderComponent={headerElement}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="bg-white rounded-2xl border border-gray-200 p-8 items-center mt-2">
              <Ionicons name="map-outline" size={32} color="#9CA3AF" />
              <Text className="text-sm font-semibold text-gray-800 mt-2">
                No matching regions or districts
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1">
                {activeOnly
                  ? 'Try turning off "Active & Available Only" or clearing your search.'
                  : 'Try clearing your search filter to see all regions.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
