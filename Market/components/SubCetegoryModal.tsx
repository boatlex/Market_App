import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SUB_CATEGORIES_BY_CATEGORY as JOB_SUB_CATEGORIES } from '../constants/createJobs';
import { SUB_CATEGORIES_BY_CATEGORY as SERVICE_SUB_CATEGORIES } from '../constants/createServices';
import { SUB_CATEGORIES_BY_CATEGORY as SEEK_JOB_SUB_CATEGORIES } from '../constants/seekJob';

export const SPECIAL_CATEGORY_ROUTES: Record<string, string> = {
  "Posted Jobs": "/my-jobs",
  "Find Job": "/(profile)/my-job-applications",
  "Services": "/all-service",
};

// Map each special route to its Record<Category, SubCategory[]> object
export const SPECIAL_ROUTE_DATA: Record<string, Record<string, string[]>> = {
  "Posted Jobs": JOB_SUB_CATEGORIES,
  "Find Job": SEEK_JOB_SUB_CATEGORIES,
  "Services": SERVICE_SUB_CATEGORIES,
};

// Keep exported for HomeScreen.tsx to check which icons open this modal
export const SPECIAL_ROUTE_SUBCATEGORIES = SPECIAL_ROUTE_DATA;

interface SubCategoryModalProps {
  visible: boolean;
  mainCategory: string;
  onClose: () => void;
}

export const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  visible,
  mainCategory,
  onClose,
}) => {
  const router = useRouter();
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset drill-down step and search when modal opens or mainCategory changes
  useEffect(() => {
    if (visible) {
      setSelectedParentCategory(null);
      setSearchQuery("");
    }
  }, [visible, mainCategory]);

  const categoryMap = SPECIAL_ROUTE_DATA[mainCategory] || {};
  const targetRoute = SPECIAL_CATEGORY_ROUTES[mainCategory];

  // Step 1 shows top-level keys; Step 2 shows subcategories under the chosen key
  const currentList = useMemo(() => {
    if (!selectedParentCategory) {
      return Object.keys(categoryMap);
    }
    return categoryMap[selectedParentCategory] || [];
  }, [categoryMap, selectedParentCategory]);

  const filteredList = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return currentList;
    return currentList.filter((item) => item.toLowerCase().includes(trimmed));
  }, [currentList, searchQuery]);

  const handleSelectAllMain = () => {
    onClose();
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  const handleSelectAllParent = () => {
    const chosenCategory = selectedParentCategory || "";
    onClose();
    if (targetRoute) {
      router.push({
        pathname: targetRoute as any,
        params: { category: chosenCategory },
      });
    }
  };

  const handleItemPress = (item: string) => {
    // STEP 1: Drill down into subcategories for the selected category
    if (!selectedParentCategory) {
      const subs = categoryMap[item] || [];
      if (subs.length > 0) {
        setSelectedParentCategory(item);
        setSearchQuery("");
        return;
      }

      // If a category has no nested subcategories, navigate directly
      onClose();
      if (targetRoute) {
        router.push({
          pathname: targetRoute as any,
          params: { category: item },
        });
      }
      return;
    }

    // STEP 2: Navigate with both category and subCategory params
    onClose();
    if (targetRoute) {
      router.push({
        pathname: targetRoute as any,
        params: {
          category: selectedParentCategory,
          subCategory: item,
        },
      });
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-[70%] p-5">
          {/* Header with Back Button on Step 2 */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              {selectedParentCategory && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedParentCategory(null);
                    setSearchQuery("");
                  }}
                  className="mr-2 p-1 rounded-full bg-gray-100"
                >
                  <Ionicons name="arrow-back" size={20} color="#000" />
                </TouchableOpacity>
              )}
              <Text numberOfLines={1} className="text-lg font-bold text-black flex-1">
                {selectedParentCategory || mainCategory}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11 mb-3 border border-gray-200">
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-sm text-black"
              placeholder={
                selectedParentCategory
                  ? `Search in ${selectedParentCategory}...`
                  : `Search ${mainCategory.toLowerCase()} categories...`
              }
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

          {/* Shortcut Row ("All Services" on Step 1, or "All Mechanics" on Step 2) */}
          {searchQuery.trim().length === 0 && (
            <TouchableOpacity
              className="py-3 mb-2 bg-green-50 px-3 rounded-xl flex-row justify-between items-center"
              onPress={selectedParentCategory ? handleSelectAllParent : handleSelectAllMain}
            >
              <Text className="text-green-700 font-semibold">
                All {selectedParentCategory || mainCategory}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#15803d" />
            </TouchableOpacity>
          )}

          {/* Scrollable List */}
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
                  No results found for "{searchQuery}".
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-3.5 border-b border-gray-100 flex-row justify-between items-center"
                onPress={() => handleItemPress(item)}
              >
                <Text className="text-black text-base">{item}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};
