import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { useSearchServiceProviders, SearchProvidersParams } from '../../hooks/useSearchServiceProviders';
import { FormInput } from '../../components/FormInput';
import { CreateServiceCard } from '../../components/createService/CreateServiceCard';
import { useRouter } from 'expo-router';
import { FormDropdown } from '../../components/FormDropdown';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  SERVICE_CATEGORIES,
  SUB_CATEGORIES_BY_CATEGORY,
} from '../../constants/createServices';

// Reusable FlatList Selector Picker Overlay Component
const FlatListPickerModal = ({
  visible,
  title,
  data,
  onSelect,
  onClose
}: {
  visible: boolean;
  title: string;
  data: readonly string[] | string[];
  onSelect: (item: string) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
    <View className="flex-1 justify-end bg-black/50">
      <View className="bg-white rounded-t-3xl max-h-[80%] pb-6">
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
          <Text className="text-gray-900 font-black text-base">{title}</Text>
          <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
            <Ionicons name="close" size={18} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data as string[]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="px-6 py-4 border-b border-gray-50 active:bg-blue-50"
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text className="text-gray-800 font-semibold text-sm">{item}</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  </Modal>
);

export const AllServiceScreen = () => {
  const router = useRouter();

  // Modal popups visibility state hooks
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

  // Active Query Tracker Hook State - Type-safe matched to your Service Provider Hook Params
  const [activeFilters, setActiveFilters] = useState<SearchProvidersParams>({
    page: 1,
    limit: 20,
    keyword: "",
    category: "",
    serviceType: "",
    region: "",
    district: ""
  });

  const [tempFilters, setTempFilters] = useState<SearchProvidersParams>({ ...activeFilters });

  const { data, isLoading } = useSearchServiceProviders(activeFilters);
  const results = data?.providers || [];

  const handleInputChange = (field: keyof SearchProvidersParams, value: any) => {
    setTempFilters(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "region") {
        updated.district = "";
      }
      if (field === "category") {
        updated.serviceType = ""; // Reset child specialty trade if main group category changes
      }
      return updated;
    });
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters, page: 1 });
    setShowFilterSheet(false);
  };

  const handleResetFilters = () => {
    const standardReset: SearchProvidersParams = {
      page: 1,
      limit: 20,
      keyword: "",
      category: "",
      serviceType: "",
      region: "",
      district: ""
    };
    setTempFilters(standardReset);
    setActiveFilters(standardReset);
    setShowFilterSheet(false);
  };

  const activeDistricts = tempFilters.region
    ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
    : [];

  const activeSubCategories = tempFilters.category
    ? SUB_CATEGORIES_BY_CATEGORY[tempFilters.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || []
    : [];

  const formattedLocationLabel = useMemo(() => {
    if (!activeFilters.region) return 'All Ghana';
    const shortDistrict = activeFilters.district ? ` - ${activeFilters.district.split(' ')[0]}` : '';
    return `${activeFilters.region}${shortDistrict}`;
  }, [activeFilters.region, activeFilters.district]);

  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">

        {/* TOP INTERACTIVE APP BAR HEADER */}
        <View className="w-full border-b border-gray-100 bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="p-1 active:bg-gray-100 rounded-full"
          >
            <Ionicons name='arrow-back' size={26} color={"#1F2937"} />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-extrabold text-lg text-gray-900 text-center" numberOfLines={1}>
              {`${results.length <= 1 ? "Posted Service" : "Posted Services"} (${results.length})`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/post-service")}
            activeOpacity={0.8}
            className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center justify-center shadow-sm shadow-blue-500/20 active:bg-blue-700"
          >
            <Ionicons name='add-circle-outline' size={16} color="#FFFFFF" className="mr-1" />
            <Text className="text-white font-bold text-xs">Post Service</Text>
          </TouchableOpacity>
        </View>

        {/* STICKY TOP SEARCH HEADER BLOCK */}
        <View className="px-4 py-3 border-b border-gray-100 bg-white">
          {/* 🔑 FIXED: Added items-center to cross-align siblings perfectly on a flat grid axis */}
          <View className="flex-row items-center gap-2">

            {/* Unified Geographic Capsule Toggle */}
            <TouchableOpacity
              onPress={() => {
                setTempFilters({ ...activeFilters });
                setShowRegionModal(true);
              }}
              className="bg-gray-100 border border-gray-200 rounded-xl px-3 h-12 justify-center max-w-[130px]"
            >
              <Text className="text-gray-800 font-extrabold text-xs" numberOfLines={1}>
                📍 {formattedLocationLabel}
              </Text>
            </TouchableOpacity>

            {/* Keyword Search Input Bar */}
            {/* 🔑 FIXED: Stripped the 'mt-4' wrapper which was dragging the middle element downward */}
            <View className="flex-1">
              <FormInput
                label=""
                placeholder="Search trades, electricians..."
                value={activeFilters.keyword}
                onChangeText={(text) => setActiveFilters(prev => ({ ...prev, keyword: text, page: 1 }))}
                // 🔑 FIXED: Added container override to kill the FormInput's hardcoded bottom margin layout parameter
                containerClassName="mb-0"
              />
            </View>

            {/* Advanced Filters Button */}
            <TouchableOpacity
              onPress={() => {
                setTempFilters({ ...activeFilters });
                setShowFilterSheet(true);
              }}
              className="bg-gray-100 border border-gray-200 rounded-xl items-center justify-center h-12 w-12"
            >
              <Ionicons name="options-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>


        {/* COMPREHENSIVE PROVIDER DATA GRID LIST */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563EB" size="large" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-20 px-6">
                <Ionicons name="construct-outline" size={56} color="#9CA3AF" />
                <Text className="text-gray-500 font-black text-base mt-4 text-center">No Professionals Found</Text>
                <Text className="text-gray-400 font-medium text-xs mt-1 text-center">Try broadening your keywords or resetting location parameters.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <CreateServiceCard
                item={item}
                onPress={() => {
                  const serviceProviderId = item.user && typeof item.user === 'object'
                    ? (item.user as any)._id || (item.user as any).id
                    : item.user;

                  router.push({
                    pathname: "/my-service/[serviceId]",
                    params: {
                      serviceId: item._id,
                      employerId: String(serviceProviderId)
                    }
                  });
                }}
              />

            )}
          />
        )}

        {/* ========================================================================= */}
        {/* ADVANCED ADVOCATE SLIDING FILTERS OVERLAY DRAWER */}
        {/* ========================================================================= */}
        <Modal visible={showFilterSheet} animationType="slide" transparent={true}>
          <View className="flex-1 justify-end bg-black/60">
            <View className="bg-white rounded-t-3xl h-[85%] pb-6">

              <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                <Text className="text-gray-950 font-black text-lg">Filter Providers</Text>
                <TouchableOpacity onPress={() => setShowFilterSheet(false)} className="p-1 bg-gray-100 rounded-full">
                  <Ionicons name="close" size={22} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Filters Input Body */}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* A. Category Picker Field */}
                <FormDropdown
                  label="General Sector Group"
                  placeholder="All Categories"
                  value={tempFilters.category || ""}
                  onPress={() => setShowCategoryModal(true)}
                />

                {/* B. Specific Specialty Trade SubCategory Picker */}
                <FormDropdown
                  label="Specialty Skill / Trade"
                  placeholder="Select specialty area"
                  value={tempFilters.serviceType || ""}
                  onPress={() => {
                    if (!tempFilters.category) {
                      Alert.alert("Required", "Please choose a general sector first.");
                      return;
                    }
                    setShowSubCategoryModal(true);
                  }}
                />

                {/* C. Region Picker */}
                <FormDropdown
                  label="Region Location"
                  placeholder="All Ghana"
                  value={tempFilters.region || ""}
                  onPress={() => setShowRegionModal(true)}
                />

                {/* D. District Picker */}
                <FormDropdown
                  label="District Area"
                  placeholder="All Districts"
                  value={tempFilters.district || ""}
                  onPress={() => {
                    if (!tempFilters.region) {
                      Alert.alert("Required", "Please select a regional boundary first.");
                      return;
                    }
                    setShowDistrictModal(true);
                  }}
                />

                {/* Action Pipeline Operation Tray */}
                <View className="flex-row gap-3 mt-6">
                  <TouchableOpacity
                    onPress={handleResetFilters}
                    className="flex-1 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 items-center justify-center active:bg-gray-100"
                  >
                    <Text className="text-gray-700 font-extrabold text-sm">Clear All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleApplyFilters}
                    className="flex-1 py-3.5 rounded-2xl bg-blue-600 items-center justify-center active:bg-blue-700 shadow-sm shadow-blue-500/10"
                  >
                    <Text className="text-white font-extrabold text-sm">Apply Filters</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* SHARED SELECTION PICKER OVERLAYS GROUP */}
        {/* ========================================================================= */}
        <FlatListPickerModal
          visible={showRegionModal}
          title="Select Region"
          data={GHANA_REGIONS}
          onSelect={(item) => {
            handleInputChange("region", item);
            // If the filter sliding drawer isn't visible, apply the region sorting parameters instantly
            if (!showFilterSheet) setActiveFilters(p => ({ ...p, region: item, district: "", page: 1 }));
          }}
          onClose={() => setShowRegionModal(false)}
        />

        <FlatListPickerModal
          visible={showDistrictModal}
          title="Select District"
          data={activeDistricts}
          onSelect={(item) => {
            handleInputChange("district", item);
            if (!showFilterSheet) setActiveFilters(p => ({ ...p, district: item, page: 1 }));
          }}
          onClose={() => setShowDistrictModal(false)}
        />

        <FlatListPickerModal
          visible={showCategoryModal}
          title="Select Core Sector"
          data={SERVICE_CATEGORIES}
          onSelect={(item) => handleInputChange("category", item)}
          onClose={() => setShowCategoryModal(false)}
        />

        <FlatListPickerModal
          visible={showSubCategoryModal}
          title="Select Specialty Trade"
          data={activeSubCategories}
          onSelect={(item) => handleInputChange("serviceType", item)}
          onClose={() => setShowSubCategoryModal(false)}
        />

      </View>
    </SafeScreen>
  );
};

export default AllServiceScreen;


