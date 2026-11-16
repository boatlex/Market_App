import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import useReports from '../../hooks/useReports';
import { Report, ReportStatus } from '../../types';

const STATUS_FILTERS: { label: string; value?: ReportStatus }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
];

const getStatusBadge = (status: ReportStatus) => {
  switch (status) {
    case 'pending':
      return { container: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
    case 'under_review':
      return { container: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review' };
    case 'resolved':
      return { container: 'bg-emerald-100', text: 'text-emerald-700', label: 'Resolved' };
    case 'dismissed':
      return { container: 'bg-gray-100', text: 'text-gray-600', label: 'Dismissed' };
  }
};

export default function MyReportsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | undefined>(undefined);

  const {
    reports,
    pagination,
    isLoadingReports,
    refetchReports,
  } = useReports({
    page,
    limit: 10,
    status: selectedStatus,
  });

  const renderTargetName = (report: Report) => {
    const target = report.targetId;
    if (!target || typeof target === 'string') {
      return `${report.targetType} (ID: ${String(target || 'Removed')})`;
    }
    if ('name' in target) return target.name;
    if ('firstName' in target) return `${target.firstName} ${target.lastName}`;
    if ('title' in target) return target.title;
    if ('businessName' in target) return target.businessName;
    if ('content' in target) return `"${target.content}"`;
    return report.targetType;
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const badge = getStatusBadge(item.status);

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-200">
        <View className="flex-row justify-between items-center mb-2">
          <View className="bg-gray-100 px-2.5 py-1 rounded-md">
            <Text className="text-[11px] font-bold text-gray-700">{item.targetType}</Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full ${badge.container}`}>
            <Text className={`text-[11px] font-bold ${badge.text}`}>{badge.label}</Text>
          </View>
        </View>

        <Text className="text-sm font-bold text-gray-900 mb-0.5" numberOfLines={1}>
          {renderTargetName(item)}
        </Text>

        <Text className="text-xs font-semibold text-gray-600 mb-1">
          Reason: {item.reason.replace(/_/g, ' ').toUpperCase()}
        </Text>

        {item.description ? (
          <Text className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg my-1.5">
            {item.description}
          </Text>
        ) : null}

        <Text className="text-[11px] text-gray-400 mt-1">
          Submitted on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeScreen>
      {/* Header */}
      <View className="px-5 pb-4 pt-12 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity className="mr-3" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">My Reports</Text>
      </View>

      {/* Filter Chips */}
      <View className="bg-white border-b border-gray-100 py-2.5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = selectedStatus === filter.value;
            return (
              <TouchableOpacity
                key={filter.label}
                className={`px-3.5 py-1.5 rounded-full border ${
                  isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'
                }`}
                onPress={() => {
                  setSelectedStatus(filter.value);
                  setPage(1);
                }}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isActive ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      <FlatList
        data={isLoadingReports ? [] : reports}
        keyExtractor={(item) => item._id}
        renderItem={renderReportItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
               refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              refetchReports();
            }}
            tintColor="#2563EB"
          />
        }

        ListEmptyComponent={
          isLoadingReports ? (
            <ActivityIndicator size="large" color="#2563EB" className="mt-12" />
          ) : (
            <View className="items-center py-16">
              <Ionicons name="flag-outline" size={42} color="#9CA3AF" />
              <Text className="text-base font-semibold text-gray-700 mt-3">
                No reports found
              </Text>
              <Text className="text-xs text-gray-400 mt-1 text-center px-8">
                Reports you submit on listings, services, jobs, or profiles will appear here.
              </Text>
            </View>
          )
        }
               ListFooterComponent={
          pagination && pagination.totalPages > 1 ? (
            <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-gray-200">
              <TouchableOpacity
                className={`px-3.5 py-2 rounded-lg bg-white border border-gray-300 ${
                  page <= 1 ? 'opacity-40' : ''
                }`}
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Text className="text-xs font-semibold text-gray-900">Previous</Text>
              </TouchableOpacity>

              <Text className="text-xs font-semibold text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </Text>

              <TouchableOpacity
                className={`px-3.5 py-2 rounded-lg bg-white border border-gray-300 ${
                  !pagination.hasNextPage ? 'opacity-40' : ''
                }`}
                disabled={!pagination.hasNextPage}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text className="text-xs font-semibold text-gray-900">Next</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }

      />
    </SafeScreen>
  );
}
