import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FlatListPickerModalProps {
  visible: boolean;
  title: string;
  data: readonly string[] | string[];
  selectedValue?: string;
  onSelect: (item: string) => void;
  onClose: () => void;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const FlatListPickerModal: React.FC<FlatListPickerModalProps> = ({
  visible,
  title,
  data,
  selectedValue,
  onSelect,
  onClose,
  emptyMessage = 'No matching options found.',
  searchable = true,
  searchPlaceholder = 'Search...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Clear search query whenever the picker opens or closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
    }
  }, [visible]);

  // Show search bar automatically when searchable is true and list has > 6 items
  const showSearchBar = searchable && data.length > 6;

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data as string[];
    return (data as string[]).filter((item) =>
      item.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="absolute inset-0 z-50 justify-end bg-black/50"
    >
      {/* Tap darkened backdrop to close */}
      <Pressable className="flex-1" onPress={onClose} />

      <View className="bg-white rounded-t-3xl max-h-[80%] pb-6 shadow-xl">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
          <Text className="text-gray-900 font-extrabold text-lg">{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1.5 bg-gray-100 rounded-full"
          >
            <Ionicons name="close" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        {showSearchBar && (
          <View className="px-6 pt-3 pb-2 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3.5 py-2.5">
              <Ionicons name="search-outline" size={18} color="#6B7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                returnKeyType="search"
                className="flex-1 ml-2 text-gray-900 text-sm font-medium"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Filtered Options List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => `${item}-${index}`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="py-10 items-center justify-center px-6">
              <Text className="text-gray-400 text-sm font-medium text-center">
                {emptyMessage}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected =
              Boolean(selectedValue) &&
              item.trim().toLowerCase() === selectedValue!.trim().toLowerCase();

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                className={`px-6 py-4 border-b border-gray-50 flex-row justify-between items-center ${
                  isSelected ? 'bg-blue-50/60' : 'active:bg-blue-50'
                }`}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  className={`text-base ${
                    isSelected ? 'text-blue-600 font-bold' : 'text-gray-800 font-medium'
                  }`}
                >
                  {item}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default FlatListPickerModal;
