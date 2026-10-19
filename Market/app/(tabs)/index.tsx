import React, { useState, ComponentProps, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import useProducts, { ProductFilters } from '../../hooks/useProducts';
import { FormInput } from '../../components/FormInput';
import { ProductCard } from '../../components/ProductCard';
import { FilterModal } from '../../components/FilterModal';
import { useRouter, Href } from 'expo-router';
import { FormDropdown } from '../../components/FormDropdown';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  CATEGORY_CONFIG,
} from '../../constants/products'  


const SPECIAL_CATEGORY_ROUTES: Record<string, string> = {
  "Posted Jobs": "/my-jobs",
  "Find Job": "/(profile)/my-job-applications",
  "Services": "/post-service",
};


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


    const formattedLocationLabel = useMemo(() => {
  if (!activeFilters.region) return 'Ghana';
  const shortDistrict = activeFilters.district ? ` - ${activeFilters.district.split(' ')[0]}` : '';
  return `${activeFilters.region}${shortDistrict}`;
}, [activeFilters.region, activeFilters.district])

  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">

        {/* STICKY TOP SEARCH HEADER BLOCK */}
        <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white">
          {/* Row 2: Single Geographic Unified Dropdown Selector */}
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

            {/* Clear Location Quick-Button (Only active if a region filter is present) */}
            {activeFilters.region && (
              <TouchableOpacity
                onPress={() => {
                  const clearedLocation = { ...activeFilters, region: "", district: "" };
                  setActiveFilters(clearedLocation);
                  setTempFilters(clearedLocation);
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
            keyExtractor={(item: any, index) => item._id || `product-grid-key-${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}

            // Render the 4-Column Category Grid at the top of the feed
            ListHeaderComponent={() => (
              <View className="bg-white rounded-2xl p-3 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-4 px-1">
                  <Text className="text-sm font-bold text-gray-800">Browse Categories</Text>
                  {activeFilters.category && (
                    <TouchableOpacity
                      onPress={() => {
                        setActiveFilters(prev => ({ ...prev, category: "" }));
                        setTempFilters(prev => ({ ...prev, category: "" }));
                      }}
                    >
                      <Text className="text-xs text-red-500 font-semibold">Clear Filter</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row flex-wrap justify-start">
                  {PRODUCT_CATEGORIES.map((category) => {
                    const config = CATEGORY_CONFIG[category] || { icon: "grid-outline", color: "#4b5563", bgColor: "bg-gray-50" };
                    const isSelected = activeFilters.category === category;

                    return (
                      <TouchableOpacity
                        key={category}
                        activeOpacity={0.7}
                        className="w-[25%] items-center justify-start px-0.5 mb-4"
                        onPress={() => {

                          // INTERCEPT CLICK: Route directly if a special route exists
                          if (SPECIAL_CATEGORY_ROUTES[category]) {
                            router.push(SPECIAL_CATEGORY_ROUTES[category] as any);
                            return; // Exit execution early so inline search filter doesn't trigger
                          }
                          // Toggle category off if clicked again, otherwise update search feed
                          const targetCategory = isSelected ? "" : category;
                          setActiveFilters(prev => ({ ...prev, category: targetCategory }));
                          setTempFilters(prev => ({ ...prev, category: targetCategory }));
                        }}
                      >
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-1.5 shadow-sm ${isSelected ? 'bg-emerald-600 border border-emerald-700' : config.bgColor
                          }`}>
                          <Ionicons
                            name={config.icon}
                            size={20}
                            color={isSelected ? "#fff" : config.color}
                          />
                        </View>
                        <Text
                          numberOfLines={2}
                          className={`text-[10px] text-center leading-tight px-0.5 ${isSelected ? 'font-bold text-emerald-600' : 'font-medium text-gray-600'
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
                onPress={() => {
                  const sellerID = typeof item.seller === 'object' && item.seller
                    ? (item.seller as any)._id
                    : item.seller;

                  router.push({
                    pathname: '/product/[id]',
                    params: {
                      id: item._id,
                      sellerID: sellerID
                    }
                  });
                }}
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
                      // 1. Update staging hook inputs
                      handleInputChange("region", item);
                      setShowRegionModal(false);

                      // 2. Chain parameters forward to the active filters immediately
                      setActiveFilters(prev => ({ ...prev, region: item, district: "" }));

                      // 3. Smooth programmatic popup transition for districts
                      setTimeout(() => {
                        setShowDistrictModal(true);
                      }, 350); // 350ms accounts perfectly for the closing modal transition slide
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
                <Text className="text-lg font-bold text-black">Choose District in {tempFilters.region}</Text>
                <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={activeDistricts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-3 border-b border-gray-100"
                    onPress={() => {
                      // 1. Commit layout query changes directly to active view hooks
                      handleInputChange("district", item);
                      setActiveFilters(prev => ({ ...prev, district: item }));

                      // 2. Dismiss the modal context safely
                      setShowDistrictModal(false);
                    }}
                  >
                    <Text className="text-black text-base">{item}</Text>
                  </TouchableOpacity>
                )}
              />
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
