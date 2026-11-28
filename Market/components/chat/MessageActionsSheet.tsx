import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface MessageActionsSheetProps {
  visible: boolean;
  message: any | null;
  isMe: boolean;
  onClose: () => void;
  onDelete: (messageId: string) => void;
  onReply?: (message: any) => void;
}

export const MessageActionsSheet: React.FC<MessageActionsSheetProps> = ({
  visible,
  message,
  isMe,
  onClose,
  onDelete,
  onReply,
}) => {
  if (!message) return null;

  const isMeme = Boolean(message.content?.startsWith('[MEME]|'));

  const extractReadableText = (): string => {
    if (isMeme) {
      const [, emoji, topText, bottomText] = message.content.split('|');
      return [topText, emoji, bottomText].filter(Boolean).join(' ');
    }
    return message.content || '';
  };

  const readableText = extractReadableText();
  const copyablePayload = readableText || message.attachment || '';
  const shareablePayload = copyablePayload;

  const handleReply = () => {
    onClose();
    onReply?.(message);
  };

  const handleCopy = async () => {
    if (!copyablePayload) return;
    await Clipboard.setStringAsync(copyablePayload);
    onClose();
  };

  const handleShare = async () => {
    onClose();
    if (!shareablePayload) return;

    try {
      await Share.share({
        message: readableText
          ? message.attachment
            ? `${readableText}\n${message.attachment}`
            : readableText
          : message.attachment,
        url: message.attachment || undefined,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleDelete = () => {
    onClose();
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this message for everyone?')) {
        onDelete(message._id);
      }
      return;
    }

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(message._id),
        },
      ]
    );
  };

  const hasActionsBelowReply =
    Boolean(copyablePayload) || Boolean(shareablePayload) || isMe;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/35 items-center justify-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-[210px] bg-white rounded-2xl py-1.5 shadow-xl border border-gray-100 overflow-hidden"
        >
          {Boolean(onReply) && (
            <TouchableOpacity
              onPress={handleReply}
              activeOpacity={0.7}
              className={`flex-row items-center px-3.5 py-2.5 active:bg-gray-50 ${
                hasActionsBelowReply ? 'border-b border-gray-100' : ''
              }`}
            >
              <Ionicons name="arrow-undo-outline" size={17} color="#111827" />
              <Text className="text-sm font-semibold text-gray-900 ml-2.5">
                Reply
              </Text>
            </TouchableOpacity>
          )}

          {Boolean(copyablePayload) && (
            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.7}
              className={`flex-row items-center px-3.5 py-2.5 active:bg-gray-50 ${
                Boolean(shareablePayload) || isMe ? 'border-b border-gray-100' : ''
              }`}
            >
              <Ionicons name="copy-outline" size={17} color="#111827" />
              <Text className="text-sm font-semibold text-gray-900 ml-2.5">
                {readableText ? 'Copy' : 'Copy Link'}
              </Text>
            </TouchableOpacity>
          )}

          {Boolean(shareablePayload) && (
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className={`flex-row items-center px-3.5 py-2.5 active:bg-gray-50 ${
                isMe ? 'border-b border-gray-100' : ''
              }`}
            >
              <Ionicons name="share-outline" size={17} color="#111827" />
              <Text className="text-sm font-semibold text-gray-900 ml-2.5">
                Share
              </Text>
            </TouchableOpacity>
          )}

          {isMe && (
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center px-3.5 py-2.5 active:bg-red-50"
            >
              <Ionicons name="trash-outline" size={17} color="#EF4444" />
              <Text className="text-sm font-semibold text-red-600 ml-2.5">
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
