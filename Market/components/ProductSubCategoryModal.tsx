import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUB_CATEGORIES_BY_CATEGORY } from '../constants/products';

interface ProductSubCategoryModalProps {
  visible: boolean;
  mainCategory: string;
  selectedCategory: string;
  selectedProductType: string;
  onClose: () => void;
  onSelect: (category: string, productType: string) => void;
}

export const ProductSubCategoryModal: React.FC<ProductSubCategoryModalProps> = ({
  visible,
  mainCategory,
  selectedCategory,
  selectedProductType,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
    }
  }, [visible, mainCategory]);

  const subCategories = useMemo(() => {
    if (!mainCategory) return [];
    return SUB_CATEGORIES_BY_CATEGORY[mainCategory as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || [];
  }, [mainCategory]);

  const filteredList = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return subCategories;
    return subCategories.filter((item) => item.toLowerCase().includes(trimmed));
  }, [subCategories, searchQuery]);

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-[65%] p-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-black">{mainCategory}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11 mb-3 border border-gray-200">
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-sm text-black"
              placeholder={`Search in ${mainCategory.toLowerCase()}...`}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* "All [Category]" Shortcut */}
          {searchQuery.trim().length === 0 && (
            <TouchableOpacity
              className="py-3 mb-2 bg-green-50 px-3 rounded-xl flex-row justify-between items-center"
              onPress={() => {
                onSelect(mainCategory, "");
                onClose();
              }}
            >
              <Text className="text-green-700 font-semibold">All {mainCategory}</Text>
              <Ionicons name="arrow-forward" size={18} color="#15803d" />
            </TouchableOpacity>
          )}

          {/* Scrollable Subcategory List */}
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-400 text-sm">
                  No subcategories found for "{searchQuery}".
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected =
                selectedCategory === mainCategory && selectedProductType === item;

              return (
                <TouchableOpacity
                  className="py-3.5 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => {
                    onSelect(mainCategory, item);
                    onClose();
                  }}
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
