import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ChatAudioMessage } from './ChatAudioMessage';
import { MemeItem } from './MemePickerSheet';

export type PendingAttachment =
  | {
      type: 'image';
      fileUri: string;
      fileName: string;
      fileType: string;
    }
  | {
      type: 'voice';
      fileUri: string;
      fileName: string;
      fileType: string;
      duration: number;
    }
  | {
      type: 'meme';
      meme: MemeItem;
    };

interface ChatAttachmentPreviewProps {
  attachment: PendingAttachment | null;
  onDiscard: () => void;
}

export const ChatAttachmentPreview: React.FC<ChatAttachmentPreviewProps> = ({
  attachment,
  onDiscard,
}) => {
  if (!attachment) return null;

  return (
    <View className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-between">
      <View className="flex-1 mr-3">
        {attachment.type === 'image' && (
          <View className="flex-row items-center gap-3">
            <Image
              source={{ uri: attachment.fileUri }}
              style={{ width: 64, height: 64, borderRadius: 12 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-800">
                Image Ready to Send
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                Add an optional caption below or tap send
              </Text>
            </View>
          </View>
        )}

        {attachment.type === 'voice' && (
          <View className="bg-white p-2 rounded-xl border border-gray-200 self-start">
            <ChatAudioMessage
              fileUrl={attachment.fileUri}
              duration={attachment.duration}
              isPeer={true}
            />
          </View>
        )}

        {attachment.type === 'meme' && (
          <View
            style={{ backgroundColor: attachment.meme.bgColor || '#1e293b' }}
            className="px-4 py-2.5 rounded-xl self-start items-center"
          >
            {attachment.meme.topText ? (
              <Text
                style={{ color: attachment.meme.textColor || '#ffffff' }}
                className="font-extrabold uppercase text-[11px]"
              >
                {attachment.meme.topText}
              </Text>
            ) : null}
            <Text className="text-2xl my-0.5">{attachment.meme.emoji}</Text>
            {attachment.meme.bottomText ? (
              <Text
                style={{ color: attachment.meme.textColor || '#ffffff' }}
                className="font-extrabold uppercase text-[11px]"
              >
                {attachment.meme.bottomText}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={onDiscard}
        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
      >
        <Ionicons name="close" size={18} color="#374151" />
      </TouchableOpacity>
    </View>
  );
};
