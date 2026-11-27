import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingAttachment } from './ChatAttatchmentPreview';

interface ChatInputBarProps {
  text: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onOpenMemePicker: () => void;
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  pendingAttachment: PendingAttachment | null;
  isSending?: boolean;
  bottomInset: number;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  text,
  onChangeText,
  onSend,
  onPickImage,
  onOpenMemePicker,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  pendingAttachment,
  isSending = false,
  bottomInset,
}) => {
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const canSend = text.trim().length > 0 || Boolean(pendingAttachment);
  const isTextInputLocked =
    pendingAttachment?.type === 'voice' || pendingAttachment?.type === 'meme';

  return (
    <View
      style={{ paddingBottom: Math.max(bottomInset, 8) }}
      className="px-3 pt-2 border-t border-gray-200 bg-white flex-row items-center"
    >
      {isRecording ? (
        <View className="flex-1 flex-row items-center justify-between bg-red-50 px-4 py-2.5 rounded-full">
          <TouchableOpacity onPress={onCancelRecording}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" />
            <Text className="text-red-600 font-semibold">
              Recording {formatDuration(recordingDuration)}
            </Text>
          </View>

          <TouchableOpacity onPress={onStopRecording}>
            <Ionicons name="stop-circle" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={onPickImage} className="p-2">
            <Ionicons name="image-outline" size={24} color="#4b5563" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenMemePicker} className="p-2 mr-1">
            <Ionicons name="happy-outline" size={24} color="#4b5563" />
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={onChangeText}
            editable={!isTextInputLocked}
            placeholder={
              pendingAttachment?.type === 'image'
                ? 'Add a caption...'
                : isTextInputLocked
                ? 'Tap send to share attachment...'
                : 'Type a message...'
            }
            placeholderTextColor="#9ca3af"
            multiline
            className={`flex-1 rounded-2xl px-4 py-2 text-base max-h-28 ${
              isTextInputLocked
                ? 'bg-gray-100/60 text-gray-400'
                : 'bg-gray-100 text-gray-900'
            }`}
          />

          {canSend ? (
            <TouchableOpacity
              onPress={onSend}
              disabled={isSending}
              className="ml-2 w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onStartRecording}
              className="ml-2 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="mic-outline" size={22} color="#374151" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};
