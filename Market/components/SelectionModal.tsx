import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectionModalProps {
  visible: boolean;
  title: string;
  items: readonly string[];
  selectedValue?: string;
  emptyText?: string;
  shortcutLabel?: string;
  onSelectShortcut?: () => void;
  onClose: () => void;
  onSelect: (item: string) => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  items,
  selectedValue,
  emptyText = "No options available.",
  shortcutLabel,
  onSelectShortcut,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-[60%] p-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-black">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Optional Shortcut Row (e.g., "All of Greater Accra") */}
          {shortcutLabel && onSelectShortcut && (
            <TouchableOpacity
              className="py-3 mb-2 bg-green-50 px-3 rounded-xl flex-row justify-between items-center"
              onPress={onSelectShortcut}
            >
              <Text className="text-green-700 font-semibold">{shortcutLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color="#15803d" />
            </TouchableOpacity>
          )}

          {/* Scrollable Options List */}
          <FlatList
            data={items}
            keyExtractor={(item) => item}
            className="flex-1"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <Text className="text-gray-400 text-center py-8">{emptyText}</Text>
            }
            renderItem={({ item }) => {
              const isSelected = selectedValue === item;
              return (
                <TouchableOpacity
                  className="py-3.5 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => onSelect(item)}
                >
                  <Text className={`text-base ${isSelected ? "font-bold text-green-700" : "text-black"}`}>
                    {item}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color="#16a34a" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};
