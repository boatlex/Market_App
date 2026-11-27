import React from 'react';
import { View, Text } from 'react-native';
import { formatChatDateHeader } from '../../lib/utils';

interface ChatDateHeaderProps {
  dateString?: string;
}

export const ChatDateHeader: React.FC<ChatDateHeaderProps> = ({ dateString }) => {
  const label = formatChatDateHeader(dateString);
  if (!label) return null;

  return (
    <View className="items-center my-3">
      <View className="bg-gray-200/80 px-3 py-1 rounded-full">
        <Text className="text-[11px] font-semibold text-gray-600">{label}</Text>
      </View>
    </View>
  );
};
