import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameSite } from '../../constants/games/gameSites';

interface GameSiteCardProps {
  site: GameSite;
  isDesktop: boolean;
  isFavorite: boolean;
  onToggleFavorite: (siteId: string) => void;
  onPress: (site: GameSite) => void;
}

export const GameSiteCard: React.FC<GameSiteCardProps> = ({
  site,
  isDesktop,
  isFavorite,
  onToggleFavorite,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(site)}
      style={{ width: isDesktop ? '48.8%' : '100%' }}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1 pr-2.5">
        <View
          style={{ backgroundColor: site.bgTint }}
          className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5 shrink-0"
        >
          <Ionicons name={site.icon} size={24} color={site.accentColor} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center flex-wrap gap-1.5 mb-0.5">
            <Text
              className="text-base font-extrabold text-gray-900"
              numberOfLines={1}
            >
              {site.name}
            </Text>
            <View
              style={{ backgroundColor: site.bgTint }}
              className="px-2 py-0.5 rounded-full"
            >
              <Text
                style={{ color: site.accentColor }}
                className="text-[10px] font-bold"
              >
                {site.badge}
              </Text>
            </View>
          </View>

          <Text
            className="text-xs text-gray-500 leading-4"
            numberOfLines={2}
          >
            {site.tagline}
          </Text>
        </View>
      </View>

      {/* Right Controls: Pin Heart + Play Button */}
      <View className="flex-row items-center gap-2 shrink-0">
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(site.id);
          }}
          className={`w-9 h-9 rounded-xl items-center justify-center border ${
            isFavorite
              ? 'bg-rose-50 border-rose-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={17}
            color={isFavorite ? '#E11D48' : '#6B7280'}
          />
        </TouchableOpacity>

        <View
          style={{ backgroundColor: site.accentColor }}
          className="px-3 py-2 rounded-xl flex-row items-center gap-1"
        >
          <Text className="text-white text-xs font-bold">Play</Text>
          <Ionicons name="open-outline" size={13} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
