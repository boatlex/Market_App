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

const AllServiceScreen = () => {
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

  const formattedLocationLabel = useMemo(() => {
    if (!activeFilters.region) return 'All Ghana';
    const shortDistrict = activeFilters.district ? ` - ${activeFilters.district.split(' ')[0]}` : '';
    return `${activeFilters.region}${shortDistrict}`;
  }, [activeFilters.region, activeFilters.district]);

  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">

        {/* STICKY TOP SEARCH HEADER BLOCK */}
        <View className="px-4 py-3 border-b border-gray-100 bg-white">
          <View className="flex-row items-center gap-2">

            {/* Unified Geographic Filter Capsule Toggle */}
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
            <View className="flex-1">
              <FormInput
                label=""
                placeholder="Search electricians, plumbers..."
                value={activeFilters.keyword}
                onChangeText={(text) => setActiveFilters(prev => ({ ...prev, keyword: text, page: 1 }))}
              />
            </View>

            {/* Advanced Filters Trigger Sheet Button */}
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}

            // 🌟 FIXED: Implemented an elegant ListHeaderComponent instead of horizontal layout overlaps
            ListHeaderComponent={() => (
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-black text-gray-900">Trade Categories</Text>
                  {activeFilters.category && (
                    <TouchableOpacity
                      onPress={() => {
                        setActiveFilters(prev => ({ ...prev, category: "", serviceType: "" }));
                        setTempFilters(prev => ({ ...prev, category: "", serviceType: "" }));
                      }}
                    >
                      <Text className="text-xs text-rose-600 font-extrabold">Reset Category</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Horizontal Scroll Pill Filters Strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {SERVICE_CATEGORIES.map((cat) => {
                    const isSelected = activeFilters.category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          const targetCat = isSelected ? "" : cat;
                          setActiveFilters(prev => ({ ...prev, category: targetCat, serviceType: "", page: 1 }));
                          setTempFilters(prev => ({ ...prev, category: targetCat, serviceType: "" }));
                        }}
                        className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-100 active:bg-gray-100'
                          }`}
                      >
                        <Text className={`text-xs font-black ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                          {cat.split(',')[0].split('&')[0].trim()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            ListEmptyComponent={() => (
              <View className="items-center justify-center py-20">
                <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 font-extrabold text-sm mt-3">No matching trade profiles found.</Text>
                <Text className="text-gray-400 text-xs mt-1 font-semibold">Try modifying your search tags or regions.</Text>
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
                    pathname: '/my-service/[serviceId]' as any,
                    params: {
                      id: item._id,
                      employerId: String(serviceProviderId)
                    }
                  })
                }
                }
              />
            )}
          />
        )}

        {/* ADVANCED FULL-SCREEN OVERLAY SIDE SHEET MODAL FILTER */}
        <Modal visible={showFilterSheet} animationType="slide" transparent={false}>
          <SafeScreen>
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
              <Text className="text-lg font-black text-gray-900">Refine Search Criteria</Text>
              <TouchableOpacity onPress={() => setShowFilterSheet(false)} className="p-2 bg-gray-50 border border-gray-100 rounded-full">
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>

              <Text className="text-gray-900 font-black text-sm mb-3">Geographic Boundaries</Text>
              <FormDropdown label="Target Region" placeholder="All of Ghana" value={tempFilters.region || ""}
                onPress={() => setShowRegionModal(true)} />

              <FormDropdown
                label="Municipal District"
                placeholder={tempFilters.region ? "Select Localized District..." : "Choose a Region first"}
                value={tempFilters.district || ""}
                onPress={() => {
                  if (!tempFilters.region) {
                    Alert.alert("Required Step", "Please assign a target region profile first.");
                    return;
                  }
                  setShowDistrictModal(true);
                }}
              />

              <Text className="text-gray-900 font-black text-sm mb-3 mt-6">Trade Specialization</Text>
              <FormDropdown label="Trade Field Industry" placeholder="All Trade Categories" value={tempFilters.category || ""}
                onPress={() => setShowCategoryModal(true)} />

              <FormDropdown
                label="Localized Specialization"
                placeholder={tempFilters.category ? "Select Specialization..." : "Choose a Trade Field first"}
                value={tempFilters.serviceType || ""}
                onPress={() => {
                  if (!tempFilters.category) {
                    Alert.alert("Required Step", "Please choose a macro industry category first.");
                    return;
                  }
                  setShowSubCategoryModal(true);
                }}
              />

              {/* Bottom Action Footer Row */}
              <View className="flex-row gap-3 mt-12 mb-10">
                <TouchableOpacity onPress={handleResetFilters} className="flex-1 py-4 border border-gray-200 rounded-xl items-center bg-gray-50 active:bg-gray-100">
                  <Text className="text-gray-600 font-extrabold text-sm">Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleApplyFilters} className="flex-2 py-4 bg-blue-600 rounded-xl items-center active:bg-blue-700 shadow-sm px-8">
                  <Text className="text-white font-extrabold text-sm">Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeScreen>
        </Modal>

        {/* CASCADING FILTER PICKER DROP DOWN LIST OVERLAYS */}
        <FlatListPickerModal visible={showRegionModal} title="Select Ghana Region" data={GHANA_REGIONS} onSelect={(val) => handleInputChange("region", val)} onClose={() => setShowRegionModal(false)} />
        <FlatListPickerModal visible={showDistrictModal} title="Select Municipal District" data={activeDistricts} onSelect={(val) => handleInputChange("district", val)} onClose={() => setShowDistrictModal(false)} />
        <FlatListPickerModal visible={showCategoryModal} title="Select Core Industry Field" data={SERVICE_CATEGORIES} onSelect={(val) => handleInputChange("category", val)} onClose={() => setShowCategoryModal(false)} />
        <FlatListPickerModal visible={showSubCategoryModal} title="Select Specialized Sub-Trade" data={tempFilters.category ? SUB_CATEGORIES_BY_CATEGORY[tempFilters.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || [] : []} onSelect={(val) => handleInputChange("serviceType", val)} onClose={() => setShowSubCategoryModal(false)} />

      </View>
    </SafeScreen>
  );
};

export default AllServiceScreen;
