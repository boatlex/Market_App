import React, { useState, ComponentProps, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import useProducts, { ProductFilters } from '../../hooks/useProducts';
import { FormInput } from '../../components/FormInput';
import { ProductCard } from '../../components/ProductCard';
import { FilterModal } from '../../components/FilterModal';
import { FormDropdown } from '../../components/FormDropdown';
import { SelectionModal } from '../../components/SelectionModal';
import {SubCategoryModal,SPECIAL_ROUTE_SUBCATEGORIES,} from '../../components/SubCetegoryModal';
import { ProductSubCategoryModal } from '../../components/ProductSubCategoryModal';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  CATEGORY_CONFIG,
  SUB_CATEGORIES_BY_CATEGORY,
} from '../../constants/products';

const INITIAL_FILTERS: ProductFilters = {
  limit: 10,
  search: "",
  category: "",
  productType: "",
  region: "",
  district: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  isAvailable: "true",
};

const HomeScreen = () => {
  const router = useRouter();

  // Modal visibility & selection states
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showSpecialSubModal, setShowSpecialSubModal] = useState(false);
  const [showProductSubModal, setShowProductSubModal] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");

  // Query filter states
  const [activeFilters, setActiveFilters] = useState<ProductFilters>(INITIAL_FILTERS);
  const [tempFilters, setTempFilters] = useState<ProductFilters>(INITIAL_FILTERS);

  const { results, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useProducts(activeFilters);

  const { width: screenWidth } = useWindowDimensions();
  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;


  const handleInputChange = (field: keyof ProductFilters, value: string) => {
    setTempFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "region") updated.district = "";
      if (field === "category") updated.productType = "";
      return updated;
    });
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters });
    setShowFilterSheet(false);
  };

  const handleResetFilters = () => {
    setTempFilters(INITIAL_FILTERS);
    setActiveFilters(INITIAL_FILTERS);
    setShowFilterSheet(false);
  };

  const activeDistricts = tempFilters.region
    ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
    : [];

  const formattedLocationLabel = useMemo(() => {
    if (!activeFilters.region) return 'Ghana';
    const shortDistrict = activeFilters.district ? ` - ${activeFilters.district.split(' ')}` : '';
    return `${activeFilters.region}${shortDistrict}`;
  }, [activeFilters.region, activeFilters.district]);

  const handleCategoryPress = (category: string) => {
    // 1. Special categories -> open standalone Special SubCategoryModal
    if (SPECIAL_ROUTE_SUBCATEGORIES[category]) {
      setSelectedMainCategory(category);
      setShowSpecialSubModal(true);
      return;
    }

    // 2. Regular product categories -> open ProductSubCategoryModal
    const subs = SUB_CATEGORIES_BY_CATEGORY[category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || [];
    if (subs.length > 0) {
      setSelectedMainCategory(category);
      setShowProductSubModal(true);
      return;
    }

    // 3. Fallback direct toggle if no subcategories exist
    const nextCategory = activeFilters.category === category ? "" : category;
    setActiveFilters((prev) => ({ ...prev, category: nextCategory, productType: "" }));
    setTempFilters((prev) => ({ ...prev, category: nextCategory, productType: "" }));
  };

  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">
        {/* STICKY TOP SEARCH HEADER */}
        <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white">
          <View>
            <View className="flex-1 justify-center items-center mb-2">
              <FormDropdown
                label=""
                placeholder="Ghana"
                value={formattedLocationLabel}
                onPress={() => {
                  setTempFilters({ ...activeFilters });
                  setShowRegionModal(true);
                }}
              />
            </View>

            {Boolean(activeFilters.region) && (
              <TouchableOpacity
                onPress={() => {
                  const cleared = { ...activeFilters, region: "", district: "" };
                  setActiveFilters(cleared);
                  setTempFilters(cleared);
                }}
                className="bg-red-50 border border-red-100 rounded-xl h-11 px-3 items-center justify-center"
              >
                <Text className="text-red-500 text-xs font-bold">All Ghana</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-1 justify-center mb-2">
            <FormInput
              label=""
              placeholder="What are you looking for?..."
              value={activeFilters.search}
              onChangeText={(text) => setActiveFilters((prev) => ({ ...prev, search: text }))}
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

        {/* PRODUCT FEED */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#16a34a" size="large" />
          </View>
        ) : (
          <FlatList
            data={results}
            key={`product-grid-${numColumns}`}
            keyExtractor={(item: any, index) => item._id || `product-grid-key-${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            numColumns={numColumns}
            columnWrapperStyle={{ justifyContent: 'flex-start', gap: 12 }}
            ListHeaderComponent={() => (
              <View className="bg-white rounded-2xl p-3 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-4 px-1">
                  <Text className="text-sm font-bold text-gray-800">
                    {activeFilters.productType
                      ? `${activeFilters.category} • ${activeFilters.productType}`
                      : activeFilters.category || "Browse Categories"}
                  </Text>
                  {Boolean(activeFilters.category || activeFilters.productType) && (
                    <TouchableOpacity
                      onPress={() => {
                        setActiveFilters((prev) => ({ ...prev, category: "", productType: "" }));
                        setTempFilters((prev) => ({ ...prev, category: "", productType: "" }));
                      }}
                    >
                      <Text className="text-xs text-red-500 font-semibold">Clear Filter</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row flex-wrap justify-start">
                  {PRODUCT_CATEGORIES.map((category) => {
                    const config = CATEGORY_CONFIG[category] || {
                      icon: "grid-outline",
                      color: "#4b5563",
                      bgColor: "bg-gray-50",
                    };
                    const isSelected = activeFilters.category === category;

                    return (
                      <TouchableOpacity
                        key={category}
                        activeOpacity={0.7}
                        className="w-[25%] items-center justify-start px-0.5 mb-4"
                        onPress={() => handleCategoryPress(category)}
                      >
                        <View
                          className={`w-12 h-12 rounded-2xl items-center justify-center mb-1.5 border ${
                            isSelected ? 'border-green-600 bg-green-50' : `border-transparent ${config.bgColor}`
                          }`}
                        >
                          <Ionicons
                            name={config.icon as ComponentProps<typeof Ionicons>['name']}
                            size={22}
                            color={isSelected ? '#16a34a' : config.color}
                          />
                        </View>
                        <Text
                          numberOfLines={2}
                          className={`text-[11px] text-center leading-tight ${
                            isSelected ? 'font-bold text-green-700' : 'font-medium text-gray-700'
                          }`}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={() => router.push(`/product/${item._id}` as Href)}
              />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
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
                  <Text className="text-red-400 text-center text-xs py-6 font-bold mb-40">
                    You've caught up with all active Products listings! 🎉
                  </Text>
                );
              }
              return null;
            }}
            ListEmptyComponent={
              <View className="items-center justify-center pt-20 mb-40">
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text className="text-red-400 text-center mt-4 text-base font-bold">
                  No items match your active filters.
                </Text>
              </View>
            }
          />
        )}

        {/* FILTER & SUBCATEGORY MODALS */}
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

        <SubCategoryModal
          visible={showSpecialSubModal}
          mainCategory={selectedMainCategory}
          onClose={() => setShowSpecialSubModal(false)}
        />

        <ProductSubCategoryModal
          visible={showProductSubModal}
          mainCategory={selectedMainCategory}
          selectedCategory={activeFilters.category || ""}
          selectedProductType={activeFilters.productType || ""}
          onClose={() => setShowProductSubModal(false)}
          onSelect={(category, productType) => {
            setActiveFilters((prev) => ({ ...prev, category, productType }));
            setTempFilters((prev) => ({ ...prev, category, productType }));
          }}
        />

        {/* REUSABLE SELECTION MODALS */}
        <SelectionModal
          visible={showRegionModal}
          title="Choose Region"
          items={GHANA_REGIONS}
          selectedValue={tempFilters.region}
          onClose={() => setShowRegionModal(false)}
          onSelect={(item) => {
            handleInputChange("region", item);
            if (!showFilterSheet) {
              setActiveFilters((prev) => ({ ...prev, region: item, district: "" }));
              setShowRegionModal(false);
              setShowDistrictModal(true);
            } else {
              setShowRegionModal(false);
            }
          }}
        />

        <SelectionModal
          visible={showDistrictModal}
          title={tempFilters.region ? `Districts in ${tempFilters.region}` : "Choose District"}
          items={activeDistricts}
          selectedValue={tempFilters.district}
          emptyText="Please select a region first."
          shortcutLabel={!showFilterSheet && tempFilters.region ? `All of ${tempFilters.region}` : undefined}
          onSelectShortcut={() => {
            setActiveFilters((prev) => ({ ...prev, region: tempFilters.region, district: "" }));
            setShowDistrictModal(false);
          }}
          onClose={() => setShowDistrictModal(false)}
          onSelect={(item) => {
            handleInputChange("district", item);
            if (!showFilterSheet) {
              setActiveFilters((prev) => ({ ...prev, region: tempFilters.region, district: item }));
            }
            setShowDistrictModal(false);
          }}
        />

        <SelectionModal
          visible={showCategoryModal}
          title="Choose Category"
          items={PRODUCT_CATEGORIES}
          selectedValue={tempFilters.category}
          onClose={() => setShowCategoryModal(false)}
          onSelect={(item) => {
            handleInputChange("category", item);
            setShowCategoryModal(false);
          }}
        />

        <SelectionModal
          visible={showConditionModal}
          title="Choose Condition"
          items={PRODUCT_CONDITIONS}
          selectedValue={tempFilters.condition}
          onClose={() => setShowConditionModal(false)}
          onSelect={(item) => {
            handleInputChange("condition", item);
            setShowConditionModal(false);
          }}
        />
      </View>
    </SafeScreen>
  );
};

export default HomeScreen;



