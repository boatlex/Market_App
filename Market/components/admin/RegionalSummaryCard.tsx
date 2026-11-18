import React from 'react';
import { View, Text } from 'react-native';
import { RegionalStatsResponse } from '../../types';

interface RegionalSummaryProps {
  summary: RegionalStatsResponse['summary'];
  activeOnly: boolean;
}

export default function RegionalSummaryCard({
  summary,
  activeOnly,
}: RegionalSummaryProps) {
  return (
    <View className="bg-blue-600 rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-blue-100">
          {activeOnly ? 'Active National Supply' : 'National Summary'}
        </Text>
        <Text className="text-xs text-blue-100">
          {summary.totalRegions} Regions • {summary.totalDistricts} Districts
        </Text>
      </View>

      <View className="flex-row justify-between">
        <SummaryStat
          label="Products"
          value={activeOnly ? summary.availableProducts : summary.products}
          subLabel={
            activeOnly
              ? `of ${summary.products.toLocaleString()} total`
              : `${summary.availableProducts.toLocaleString()} avail`
          }
        />
        <SummaryStat
          label="Services"
          value={activeOnly ? summary.availableServices : summary.services}
          subLabel={
            activeOnly
              ? `of ${summary.services.toLocaleString()} total`
              : `${summary.availableServices.toLocaleString()} avail`
          }
        />
        <SummaryStat
          label="Jobs"
          value={activeOnly ? summary.openJobs : summary.jobs}
          subLabel={
            activeOnly
              ? `of ${summary.jobs.toLocaleString()} total`
              : `${summary.openJobs.toLocaleString()} open`
          }
        />
        <SummaryStat
          label="Seekers"
          value={activeOnly ? summary.activeJobSeekers : summary.jobSeekers}
          subLabel={
            activeOnly
              ? `of ${summary.jobSeekers.toLocaleString()} total`
              : `${summary.activeJobSeekers.toLocaleString()} active`
          }
        />
      </View>
    </View>
  );
}

function SummaryStat({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: number;
  subLabel?: string;
}) {
  return (
    <View className="items-center flex-1">
      <Text className="text-lg font-bold text-white">
        {value.toLocaleString()}
      </Text>
      <Text className="text-[11px] text-blue-100 mt-0.5">{label}</Text>
      {subLabel && (
        <Text className="text-[10px] text-blue-200/90 mt-0.5">{subLabel}</Text>
      )}
    </View>
  );
}
