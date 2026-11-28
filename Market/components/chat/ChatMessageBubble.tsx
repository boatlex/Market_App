import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatAudioMessage } from './ChatAudioMessage';
import { ChatImageMessage } from './ChatImageMessage';
import { ChatDateHeader } from './ChatDateHeader';
import { formatMessageTime } from '../../lib/utils';

interface ChatMessageBubbleProps {
  item: any;
  isMe: boolean;
  showDateHeader: boolean;
  onLongPress?: (item: any) => void;
  onPressReplyQuote?: (replyMessageId: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  item,
  isMe,
  showDateHeader,
  onLongPress,
  onPressReplyQuote,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeLabel = formatMessageTime(item.createdAt);
  const handleOpenActions = () => onLongPress?.(item);

  const webMouseProps =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
          onContextMenu: (e: any) => {
            e.preventDefault();
            handleOpenActions();
          },
        }
      : {};

  const renderWebActionButton = () => {
    if (Platform.OS !== 'web') return null;

    return (
      <TouchableOpacity
        onPress={handleOpenActions}
        className={`p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 self-center ml-1.5 ${
          isHovered ? 'opacity-100' : 'opacity-40'
        }`}
      >
        <Ionicons name="ellipsis-vertical" size={14} color="#4B5563" />
      </TouchableOpacity>
    );
  };

  const renderReceiptTick = (isRead?: boolean) => {
    if (!isMe) return null;

    if (isRead) {
      return (
        <View className="ml-1 px-1 py-0.5 rounded-full bg-white/95 items-center justify-center">
          <Ionicons name="checkmark-done" size={13} color="#1D4ED8" />
        </View>
      );
    }

    return (
      <View className="ml-1 opacity-55">
        <Ionicons name="checkmark" size={13} color="#DBEAFE" />
      </View>
    );
  };

  const renderReplyQuote = (forceDarkCard = false) => {
    const reply = item.replyTo;
    if (!reply || typeof reply !== 'object') return null;

    const senderObj = typeof reply.senderId === 'object' ? reply.senderId : null;
    const senderName = senderObj
      ? `${senderObj.firstName || ''} ${senderObj.lastName || ''}`.trim() || 'User'
      : 'Message';

    let previewText = reply.content || '';
    if (reply.messageType === 'image') {
      previewText = reply.content ? `📷 ${reply.content}` : '📷 Photo';
    } else if (reply.messageType === 'voice') {
      previewText = '🎤 Voice message';
    } else if (reply.content?.startsWith('[MEME]|')) {
      previewText = '🎭 Meme';
    }

    const useLightOnDark = isMe || forceDarkCard;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => reply._id && onPressReplyQuote?.(reply._id)}
        className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-4 ${
          useLightOnDark
            ? 'bg-black/15 border-l-white/90'
            : 'bg-black/5 border-l-blue-600'
        }`}
      >
        <Text
          numberOfLines={1}
          className={`text-[11px] font-bold ${
            useLightOnDark ? 'text-blue-100' : 'text-blue-700'
          }`}
        >
          {senderName}
        </Text>
        <Text
          numberOfLines={1}
          className={`text-xs mt-0.5 ${
            useLightOnDark ? 'text-white/90' : 'text-gray-600'
          }`}
        >
          {previewText}
        </Text>
      </TouchableOpacity>
    );
  };

  const wrapWithWebRow = (bubbleContent: React.ReactNode) => (
    <View>
      {showDateHeader && <ChatDateHeader dateString={item.createdAt} />}
      <View
        {...(webMouseProps as any)}
        style={
          Platform.OS === 'web'
            ? {
                paddingLeft: 16,
                paddingRight: isMe ? 28 : 16,
              }
            : undefined
        }
        className={`my-1 px-4 flex-row items-center ${
          isMe ? 'justify-end' : 'justify-start'
        }`}
      >
        {bubbleContent}
        {renderWebActionButton()}
      </View>
    </View>
  );

  // 1. Voice Note
  if (item.messageType === 'voice' && item.attachment) {
    return wrapWithWebRow(
      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={250}
        onLongPress={handleOpenActions}
        className={`px-3 py-2 rounded-2xl ${
          isMe ? 'bg-blue-600 rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'
        }`}
      >
        {renderReplyQuote()}
        <ChatAudioMessage
          fileUrl={item.attachment}
          duration={item.voiceDuration || 0}
          isPeer={!isMe}
        />
        {(timeLabel || isMe) && (
          <View className="flex-row items-center justify-end mt-1">
            {timeLabel ? (
              <Text
                className={`text-[10px] ${
                  isMe ? 'text-blue-200' : 'text-gray-400'
                }`}
              >
                {timeLabel}
              </Text>
            ) : null}
            {renderReceiptTick(item.read)}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // 2. Photo Message (with optional caption)
  if (item.messageType === 'image' && item.attachment) {
    return wrapWithWebRow(
      <TouchableOpacity
        activeOpacity={0.9}
        delayLongPress={250}
        onLongPress={handleOpenActions}
        className={`p-1.5 rounded-2xl max-w-[240px] ${
          isMe ? 'bg-blue-600 rounded-br-sm' : 'bg-gray-200 rounded-bl-sm'
        }`}
      >
        {renderReplyQuote()}
        <ChatImageMessage
          uri={item.attachment}
          onLongPress={handleOpenActions}
        />
        {item.content ? (
          <Text
            className={`text-sm mt-1.5 px-1 ${
              isMe ? 'text-white' : 'text-gray-900'
            }`}
          >
            {item.content}
          </Text>
        ) : null}
        {(timeLabel || isMe) && (
          <View className="flex-row items-center justify-end mt-1 px-1">
            {timeLabel ? (
              <Text
                className={`text-[10px] ${
                  isMe ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {timeLabel}
              </Text>
            ) : null}
            {renderReceiptTick(item.read)}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // 3. Meme Message
  if (item.content?.startsWith('[MEME]|')) {
    const [, emoji, topText, bottomText, bgColor, textColor] =
      item.content.split('|');
    return wrapWithWebRow(
      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={250}
        onLongPress={handleOpenActions}
        style={{ backgroundColor: bgColor || '#1e293b' }}
        className="p-4 rounded-2xl max-w-[75%] items-center shadow-sm"
      >
        <View className="w-full">{renderReplyQuote(true)}</View>
        {topText ? (
          <Text
            style={{ color: textColor || '#ffffff' }}
            className="font-extrabold text-center uppercase text-sm mb-2"
          >
            {topText}
          </Text>
        ) : null}
        <Text className="text-4xl my-1">{emoji}</Text>
        {bottomText ? (
          <Text
            style={{ color: textColor || '#ffffff' }}
            className="font-extrabold text-center uppercase text-sm mt-2"
          >
            {bottomText}
          </Text>
        ) : null}
        {(timeLabel || isMe) && (
          <View className="flex-row items-center self-end mt-2">
            {timeLabel ? (
              <Text
                style={{ color: textColor || '#ffffff', opacity: 0.75 }}
                className="text-[10px]"
              >
                {timeLabel}
              </Text>
            ) : null}
            {renderReceiptTick(item.read)}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // 4. Standard Text Bubble
  return wrapWithWebRow(
    <TouchableOpacity
      activeOpacity={0.85}
      delayLongPress={250}
      onLongPress={handleOpenActions}
      className={`px-4 py-2.5 rounded-2xl max-w-[78%] ${
        isMe ? 'bg-blue-600 rounded-br-sm' : 'bg-gray-200 rounded-bl-sm'
      }`}
    >
      {renderReplyQuote()}
      <Text className={isMe ? 'text-white text-base' : 'text-gray-900 text-base'}>
        {item.content || ''}
      </Text>
      {(timeLabel || isMe) && (
        <View className="flex-row items-center justify-end mt-1">
          {timeLabel ? (
            <Text
              className={`text-[10px] ${
                isMe ? 'text-blue-200' : 'text-gray-500'
              }`}
            >
              {timeLabel}
            </Text>
          ) : null}
          {renderReceiptTick(item.read)}
        </View>
      )}
    </TouchableOpacity>
  );
};
