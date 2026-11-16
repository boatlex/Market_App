import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Report, ReportStatus } from '../../types';

interface AdminReportCardProps {
  report: Report;
  onUpdateStatus: (payload: { reportId: string; status: ReportStatus }) => void;
  isBusy: boolean;
}

const getStatusBadgeClasses = (status: ReportStatus) => {
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

export default function AdminReportCard({
  report,
  onUpdateStatus,
  isBusy,
}: AdminReportCardProps) {
  const badge = getStatusBadgeClasses(report.status);
  const reporter =
    typeof report.reporterId === 'object' && report.reporterId !== null
      ? `${report.reporterId.firstName} ${report.reporterId.lastName}`
      : 'Unknown User';

  const renderTargetPreview = () => {
    const target = report.targetId;
    if (!target || typeof target === 'string') {
      return (
        <Text className="text-xs text-gray-400 mt-0.5">
          Target ID: {String(target || 'Deleted')}
        </Text>
      );
    }

    if (report.targetType === 'Product' && 'name' in target) {
      return (
        <Text className="text-xs font-semibold text-blue-600 mb-1" numberOfLines={1}>
          Product: {target.name} • GHS {target.price}
        </Text>
      );
    }

    if (report.targetType === 'User' && 'email' in target) {
      return (
        <Text className="text-xs font-semibold text-blue-600 mb-1" numberOfLines={1}>
          User: {target.firstName} {target.lastName} ({target.email})
        </Text>
      );
    }

    if (report.targetType === 'Comment' && 'content' in target) {
      return (
        <Text className="text-xs font-semibold text-blue-600 mb-1" numberOfLines={2}>
          Comment: "{target.content}"
        </Text>
      );
    }

    if ('title' in target) {
      return (
        <Text className="text-xs font-semibold text-blue-600 mb-1" numberOfLines={1}>
          {report.targetType}: {target.title}
        </Text>
      );
    }

    if ('businessName' in target) {
      return (
        <Text className="text-xs font-semibold text-blue-600 mb-1" numberOfLines={1}>
          Service: {target.businessName}
        </Text>
      );
    }

    return (
      <Text className="text-xs font-semibold text-blue-600 mb-1">
        Reported {report.targetType}
      </Text>
    );
  };

  return (
    <View className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-center mb-2">
        <View className="bg-gray-100 px-2.5 py-1 rounded-md">
          <Text className="text-[11px] font-bold text-gray-700">{report.targetType}</Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${badge.container}`}>
          <Text className={`text-[11px] font-bold ${badge.text}`}>{badge.label}</Text>
        </View>
      </View>

      <Text className="text-xs font-bold text-gray-900 mb-1">
        Reason: {report.reason.replace(/_/g, ' ').toUpperCase()}
      </Text>
      {renderTargetPreview()}

      {report.description ? (
        <Text className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg my-1.5">
          {report.description}
        </Text>
      ) : null}

      <Text className="text-xs text-gray-500 mt-0.5">
        Reported by {reporter} • {new Date(report.createdAt).toLocaleDateString()}
      </Text>

      <View className="flex-row gap-2 mt-3">
        {report.status !== 'under_review' && (
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center bg-blue-50"
            disabled={isBusy}
            onPress={() => onUpdateStatus({ reportId: report._id, status: 'under_review' })}
          >
            <Text className="text-xs font-bold text-blue-600">Review</Text>
          </TouchableOpacity>
        )}

        {report.status !== 'resolved' && (
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center bg-emerald-50"
            disabled={isBusy}
            onPress={() => onUpdateStatus({ reportId: report._id, status: 'resolved' })}
          >
            <Text className="text-xs font-bold text-emerald-600">Resolve</Text>
          </TouchableOpacity>
        )}

        {report.status !== 'dismissed' && (
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center bg-gray-100"
            disabled={isBusy}
            onPress={() => onUpdateStatus({ reportId: report._id, status: 'dismissed' })}
          >
            <Text className="text-xs font-bold text-gray-600">Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
