import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useReportModalStore } from '../../stores/useReportModalStore';
import useReports from '../../hooks/useReports';
import { ReportReason } from '../../types';
import { useAuth } from '../../contexts/authContext';
import { useRouter } from 'expo-router';

const REASONS: { label: string; value: ReportReason }[] = [
  { label: 'Scam / Fraudulent activity', value: 'scam' },
  { label: 'Inappropriate or explicit content', value: 'inappropriate_content' },
  { label: 'Fake item / Counterfeit listing', value: 'fake_item' },
  { label: 'Harassment or hate speech', value: 'harassment' },
  { label: 'Other rules violations', value: 'other' },
];

export default function GlobalReportModal() {
  const router = useRouter();
  const { user } = useAuth(); 
  
  const { isOpen, targetType, targetId, closeReportModal } = useReportModalStore();
  const { createReport, isCreatingReport } = useReports();
  
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && !user) {
      closeReportModal();
      // Redirects unauthenticated users to the Auth Stack Screen group
      router.push('/(auth)');
    }
  }, [isOpen, user]);

  if (!isOpen || !targetType || !targetId || !user) return null;

  const handleClose = () => {
    setReason(null);
    setDescription('');
    closeReportModal();
  };

  const handleSubmit = () => {
    if (!reason) {
      Alert.alert('Required', 'Please select a reason for reporting.');
      return;
    }

    createReport(
      {
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Report Submitted', 'Thank you. Our safety team will review this item.');
          handleClose();
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to submit report. Please try again.');
        },
      }
    );
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        {/* Backdrop close */}
        <TouchableOpacity activeOpacity={1} className="flex-1" onPress={handleClose} />
        
        {/* Modal Container */}
        <View className="bg-white rounded-t-3xl px-5 pt-6 pb-8 max-h-[85%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Report {targetType}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text className="text-sm font-semibold text-gray-500">Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-500 mb-4">
            Help us protect our marketplace ecosystem. Select a fitting reason below:
          </Text>

          {/* Reason Selectable Options */}
          <View className="space-y-2 ">
            {REASONS.map((item) => {
              const isSelected = reason === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setReason(item.value)}
                  className={`flex-row items-center justify-between p-3.5 rounded-xl border ${
                    isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text className={`text-sm ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                    {item.label}
                  </Text>
                  <View className={`w-4 h-4 rounded-full border items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-400'}`}>
                    {isSelected && <View className="w-2 h-2 rounded-full bg-blue-600" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Details Input */}
          <Text className="text-sm font-semibold text-gray-800 ">Additional context (Optional)</Text>
          <TextInput
            multiline
            numberOfLines={3}
            maxLength={500}
            placeholder="Provide specific details about your issue..."
            value={description}
            onChangeText={setDescription}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 text-top mb-6 h-20"
            style={{ textAlignVertical: 'top' }}
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isCreatingReport}
            className={`w-full h-12 rounded-xl items-center justify-center ${isCreatingReport ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            {isCreatingReport ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white text-base font-bold">Submit Safety Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
