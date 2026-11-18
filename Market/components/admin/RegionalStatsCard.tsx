import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RegionStat, DistrictStat } from '../../types';

interface RegionStatCardProps {
  region: RegionStat;
  isExpanded: boolean;
  activeOnly: boolean;
  onToggle: () => void;
}

export default function RegionStatCard({
  region,
  isExpanded,
  activeOnly,
  onToggle,
}: RegionStatCardProps) {
  const activeTotal =
    region.availableProducts +
    region.availableServices +
    region.openJobs +
    region.activeJobSeekers;

  const displayedTotal = activeOnly ? activeTotal : region.total;

  return (
    <View className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden">
      {/* Region Header */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onToggle}
        className="p-4"
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-1 pr-2">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="location" size={18} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                {region.region || 'Unspecified Region'}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {region.districts.length}{' '}
                {region.districts.length === 1 ? 'District' : 'Districts'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="bg-blue-50 px-2.5 py-1 rounded-full mr-2">
              <Text className="text-xs font-bold text-blue-700">
                {displayedTotal.toLocaleString()}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#6B7280"
            />
          </View>
        </View>

        {/* 4-Column Metric Pills */}
        <View className="flex-row justify-between bg-gray-50 rounded-xl p-2.5">
          <MetricBadge
            label="Products"
            value={activeOnly ? region.availableProducts : region.products}
            subValue={
              activeOnly
                ? `of ${region.products}`
                : `${region.availableProducts} avail`
            }
            color="text-emerald-700"
          />
          <MetricBadge
            label="Services"
            value={activeOnly ? region.availableServices : region.services}
            subValue={
              activeOnly
                ? `of ${region.services}`
                : `${region.availableServices} avail`
            }
            color="text-purple-700"
          />
          <MetricBadge
            label="Jobs"
            value={activeOnly ? region.openJobs : region.jobs}
            subValue={
              activeOnly ? `of ${region.jobs}` : `${region.openJobs} open`
            }
            color="text-amber-700"
          />
          <MetricBadge
            label="Seekers"
            value={activeOnly ? region.activeJobSeekers : region.jobSeekers}
            subValue={
              activeOnly
                ? `of ${region.jobSeekers}`
                : `${region.activeJobSeekers} active`
            }
            color="text-blue-700"
          />
        </View>
      </TouchableOpacity>

      {/* Expandable District Breakdown */}
      {isExpanded && (
        <View className="border-t border-gray-100 bg-gray-50/70 px-4 py-2">
          {region.districts.length === 0 ? (
            <Text className="text-xs text-gray-400 py-2 text-center">
              No district data recorded
            </Text>
          ) : (
            region.districts.map((dist, idx) => (
              <DistrictRow
                key={`${region.region}-${dist.district}-${idx}`}
                district={dist}
                activeOnly={activeOnly}
                isLast={idx === region.districts.length - 1}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

function DistrictRow({
  district,
  activeOnly,
  isLast,
}: {
  district: DistrictStat;
  activeOnly: boolean;
  isLast: boolean;
}) {
  const activeTotal =
    district.availableProducts +
    district.availableServices +
    district.openJobs +
    district.activeJobSeekers;

  return (
    <View className={`py-2.5 ${!isLast ? 'border-b border-gray-200/70' : ''}`}>
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-xs font-semibold text-gray-800 flex-1 pr-2">
          {district.district || 'Unspecified District'}
        </Text>
        <Text className="text-xs font-bold text-gray-600">
          {activeOnly ? `Active: ${activeTotal}` : `Total: ${district.total}`}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="text-[11px] text-gray-600">
          Products:{' '}
          <Text className="font-semibold text-gray-900">
            {activeOnly ? district.availableProducts : district.products}
          </Text>{' '}
          <Text className="text-emerald-700 font-medium">
            {activeOnly
              ? `(${district.products} total)`
              : `(${district.availableProducts} avail)`}
          </Text>
        </Text>
        <Text className="text-[11px] text-gray-600">
          Services:{' '}
          <Text className="font-semibold text-gray-900">
            {activeOnly ? district.availableServices : district.services}
          </Text>{' '}
          <Text className="text-purple-700 font-medium">
            {activeOnly
              ? `(${district.services} total)`
              : `(${district.availableServices} avail)`}
          </Text>
        </Text>
        <Text className="text-[11px] text-gray-600">
          Jobs:{' '}
          <Text className="font-semibold text-gray-900">
            {activeOnly ? district.openJobs : district.jobs}
          </Text>{' '}
          <Text className="text-amber-700 font-medium">
            {activeOnly
              ? `(${district.jobs} total)`
              : `(${district.openJobs} open)`}
          </Text>
        </Text>
        <Text className="text-[11px] text-gray-600">
          Seekers:{' '}
          <Text className="font-semibold text-gray-900">
            {activeOnly ? district.activeJobSeekers : district.jobSeekers}
          </Text>{' '}
          <Text className="text-blue-700 font-medium">
            {activeOnly
              ? `(${district.jobSeekers} total)`
              : `(${district.activeJobSeekers} active)`}
          </Text>
        </Text>
      </View>
    </View>
  );
}

function MetricBadge({
  label,
  value,
  subValue,
  color,
}: {
  label: string;
  value: number;
  subValue?: string;
  color: string;
}) {
  return (
    <View className="items-center flex-1">
      <Text className={`text-sm font-bold ${color}`}>
        {value.toLocaleString()}
      </Text>
      <Text className="text-[10px] text-gray-500 mt-0.5">{label}</Text>
      {subValue && (
        <Text className="text-[9px] font-medium text-gray-500 mt-0.5">
          {subValue}
        </Text>
      )}
    </View>
  );
}
