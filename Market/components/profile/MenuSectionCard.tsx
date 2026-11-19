import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MenuItemConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  onPress: () => void;
}

interface MenuSectionCardProps {
  sectionTitle?: string;
  items: MenuItemConfig[];
}

export default function MenuSectionCard({
  sectionTitle,
  items,
}: MenuSectionCardProps) {
  if (items.length === 0) return null;

  return (
    <View className="bg-white mx-4 rounded-3xl p-2 shadow-sm mb-4">
      {sectionTitle && (
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-3 ml-3 mb-1">
          {sectionTitle}
        </Text>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={item.onPress}
            className={`flex-row items-center justify-between p-3.5 ${
              !isLast ? 'border-b border-gray-100' : ''
            }`}
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View
                style={{ backgroundColor: item.iconBg || '#F3F4F6' }}
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
              >
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={item.iconColor || '#374151'}
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {item.badgeText && (
                <View className="bg-blue-50 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[11px] font-bold text-blue-600">
                    {item.badgeText}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
