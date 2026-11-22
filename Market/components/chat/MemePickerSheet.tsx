import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MemeItem {
  id: string;
  emoji: string;
  topText: string;
  bottomText: string;
  bgColor: string;
  textColor: string;
}

export const MEME_COLLECTION: MemeItem[] = [
  {
    id: 'deal',
    emoji: '💸',
    topText: 'SHUT UP AND',
    bottomText: 'TAKE MY MONEY!',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
  },
  {
    id: 'thinking',
    emoji: '🤔',
    topText: 'HMMM...',
    bottomText: 'LET ME THINK ABOUT IT',
    bgColor: '#E0E7FF',
    textColor: '#1E40AF',
  },
  {
    id: 'discount',
    emoji: '🙏',
    topText: 'BOSS PLEASE',
    bottomText: 'LAST PRICE?',
    bgColor: '#FCE7F3',
    textColor: '#9D174D',
  },
  {
    id: 'done',
    emoji: '🤝',
    topText: 'DEAL',
    bottomText: 'LOCKED IN!',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
  },
  {
    id: 'waiting',
    emoji: '👀',
    topText: 'STILL AVAILABLE?',
    bottomText: 'READY TO BUY NOW',
    bgColor: '#F3E8FF',
    textColor: '#6B21A8',
  },
  {
    id: 'shocked',
    emoji: '😱',
    topText: 'WAIT WHAT?!',
    bottomText: 'WHAT A STEAL!',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
  },
];

interface MemePickerSheetProps {
  visible: boolean;
  onSelectMeme: (meme: MemeItem) => void;
  onClose: () => void;
}

export const MemePickerSheet: React.FC<MemePickerSheetProps> = ({
  visible,
  onSelectMeme,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <View className="bg-gray-50 border-t border-gray-200 px-3 pt-2.5 pb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-xs font-bold text-gray-700">Quick Marketplace Memes</Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="p-1 bg-gray-200 rounded-full"
        >
          <Ionicons name="close" size={14} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* 3-Column Native Meme Card Grid */}
      <FlatList
        data={MEME_COLLECTION}
        numColumns={3}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onSelectMeme(item)}
            style={{ backgroundColor: item.bgColor }}
            className="flex-1 rounded-xl p-2 items-center justify-center border border-black/5 h-24"
          >
            <Text className="text-2xl mb-1">{item.emoji}</Text>
            <Text
              numberOfLines={1}
              style={{ color: item.textColor }}
              className="text-[9px] font-extrabold text-center tracking-tight"
            >
              {item.topText}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: item.textColor }}
              className="text-[9px] font-black text-center tracking-tight"
            >
              {item.bottomText}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
