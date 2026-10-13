import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import useProducts, { ProductFilters } from '../../hooks/useProducts';
import { FormInput } from '../../components/FormInput';
import { ProductCard } from '../../components/ProductCard';
import { FilterModal } from '../../components/FilterModal';
import { useRouter, Href } from 'expo-router';

import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS
} from '../../constants'

const HomeScreen = () => {
  const router = useRouter();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Active Query Tracker State
  const [activeFilters, setActiveFilters] = useState<ProductFilters>({
    limit: 10,
    search: "",
    category: "",
    productType: "",
    region: "",
    district: "",
    condition: "",
    minPrice: "",
    maxPrice: "",
    isAvailable: "true"
  });

  // Staging zone temporary state
  const [tempFilters, setTempFilters] = useState<ProductFilters>({ ...activeFilters });

  const {
    results,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useProducts(activeFilters);

  const handleInputChange = (field: keyof ProductFilters, value: string) => {
    setTempFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "region") {
        updated.district = "";
      }
      return updated;
    });
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters });
    setShowFilterSheet(false);
  };

  const handleResetFilters = () => {
    const standardReset = {
      page: 1,
      limit: 10,
      search: "",
      category: "",
      region: "",
      district: "",
      condition: "",
      minPrice: "",
      maxPrice: "",
      isAvailable: "" 
    };
    setTempFilters(standardReset);
    setActiveFilters(standardReset);
    setShowFilterSheet(false);
  };

  // Safe accessor to fetch current districts based on regional selections
  const activeDistricts = tempFilters.region
    ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
    : [];

  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">

        {/* STICKY TOP SEARCH HEADER BLOCK */}
        <View className="px-4 py-2 flex-row items-center space-x-3 border-b border-gray-100 bg-white">
          <View className="flex-1 justify-center mb-2">
            <FormInput
              label=""
              placeholder="What are you looking for today?..."
              value={activeFilters.search}
              onChangeText={(text) => setActiveFilters(prev => ({ ...prev, search: text }))}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              setTempFilters({ ...activeFilters });
              setShowFilterSheet(true);
            }}
            className="bg-gray-100 border border-gray-200 rounded-xl items-center justify-center h-12 w-12"
          >
            <Ionicons name="options-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* PRODUCT FEED LIST RENDERER WITH INFINITE SCROLL */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#16a34a" size="large" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item: any) => item._id || Math.random().toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={() => router.push(`/product/${item._id}` as Href)}
              />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}

            ListFooterComponent={() => {
              if (isFetchingNextPage) {
                return (
                  <View className="py-4 items-center justify-center">
                    <ActivityIndicator size="small" color="#16a34a" />
                  </View>
                );
              }
              if (results && results.length > 0 && !hasNextPage) {
                return (
                  <Text className="text-gray-400 text-center text-xs py-6 font-medium">
                    You've caught up with all active listings! 🎉
                  </Text>
                );
              }
              return null;
            }}

            ListEmptyComponent={
              <View className="items-center justify-center pt-20">
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text className="text-gray-400 text-center mt-4 text-base font-medium">No items match your active filters.</Text>
              </View>
            }
          />
        )}

        {/* REUSABLE EXTERNAL FILTER MODAL SHEET */}
        <FilterModal
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          tempFilters={tempFilters}
          setTempFilters={setTempFilters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          setShowRegionModal={setShowRegionModal}
          setShowDistrictModal={setShowDistrictModal}
          setShowCategoryModal={setShowCategoryModal}
          setShowConditionModal={setShowConditionModal}
        />

        {/* ======================================================== */}
        {/* SUBSIDIARY SELECTION OVERLAY MODAL BOTTOM SHEETS        */}
        {/* ======================================================== */}

        {/* Category Selection Sheet */}
        <Modal visible={showCategoryModal} transparent={true} animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-black">Choose Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={PRODUCT_CATEGORIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-100"
                    onPress={() => {
                      handleInputChange("category", item);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text className="text-black text-base">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Region Selection Sheet */}
        <Modal visible={showRegionModal} transparent={true} animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-black">Choose Region</Text>
                <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={GHANA_REGIONS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-100"
                    onPress={() => {
                      handleInputChange("region", item);
                      setShowRegionModal(false);
                    }}
                  >
                    <Text className="text-black text-base">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* District Selection Sheet */}
        <Modal visible={showDistrictModal} transparent={true} animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-black">Choose District / City</Text>
                <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              {activeDistricts.length === 0 ? (
                <Text className="text-gray-400 text-center py-6 font-medium">Please choose a Region first</Text>
              ) : (
                <FlatList
                  data={activeDistricts}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="py-3 border-b border-gray-100"
                      onPress={() => {
                        handleInputChange("district", item);
                        setShowDistrictModal(false);
                      }}
                    >
                      <Text className="text-black text-base">{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Condition Selection Sheet */}
        <Modal visible={showConditionModal} transparent={true} animationType="slide">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-black">Choose Condition</Text>
                <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={PRODUCT_CONDITIONS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-100"
                    onPress={() => {
                      handleInputChange("condition", item);
                      setShowConditionModal(false);
                    }}
                  >
                    <Text className="text-black text-base">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

      </View>
    </SafeScreen>
  );
};

export default HomeScreen;
