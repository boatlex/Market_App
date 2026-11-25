import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useSearchServiceProviders, SearchProvidersParams } from '../../hooks/useSearchServiceProviders';
import { FormInput } from '../../components/FormInput';
import { CreateServiceCard } from '../../components/createService/CreateServiceCard';
import { FormDropdown } from '../../components/FormDropdown';
import FlatListPickerModal from '../../components/FlatListPickerModal';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  SERVICE_CATEGORIES,
  SUB_CATEGORIES_BY_CATEGORY,
} from '../../constants/createServices';


export const AllServiceScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; subCategory?: string }>();

const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

  const [activeFilters, setActiveFilters] = useState<SearchProvidersParams>({
    page: 1,
    limit: 20,
    keyword: "",
    category: params.category || "",
    serviceType: params.subCategory || "",
    region: "",
    district: "",
  });

  const [tempFilters, setTempFilters] = useState<SearchProvidersParams>({ ...activeFilters });
  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;


  useEffect(() => {
    const incomingFilters: SearchProvidersParams = {
      page: 1,
      limit: 20,
      keyword: "",
      category: params.category || "",
      serviceType: params.subCategory || "",
      region: "",
      district: "",
    };
    setActiveFilters(incomingFilters);
    setTempFilters(incomingFilters);
  }, [params.category, params.subCategory]);

  const { data, isLoading } = useSearchServiceProviders(activeFilters);
  const results = data?.providers || [];

  const handleInputChange = (field: keyof SearchProvidersParams, value: any) => {
    setTempFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "region") updated.district = "";
      if (field === "category") updated.serviceType = "";
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
      district: "",
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
      <View
        className="flex-1 bg-gray-50 overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
      >
        {/* TOP APP BAR */}
        <View className="w-full border-b border-gray-100 bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity
            onPress={() => {
              const canGoBack =
                Platform.OS === 'web'
                  ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
                  : router.canGoBack();

              if (canGoBack) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            }}
            activeOpacity={0.7}
            className="p-1 rounded-full"
          >
            <Ionicons name="arrow-back" size={26} color="#1F2937" />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-extrabold text-lg text-gray-900 text-center" numberOfLines={1}>
              {`${results.length <= 1 ? 'Posted Service' : 'Posted Services'} (${results.length})`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/post-service')}
            activeOpacity={0.8}
            className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center justify-center shadow-sm shadow-blue-500/20 active:bg-blue-700"
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" className="mr-1" />
            <Text className="text-white font-bold text-xs">Post Service</Text>
          </TouchableOpacity>
        </View>

        {/* STICKY SEARCH HEADER */}
        <View className="px-4 py-3 border-b border-gray-100 bg-white">
          <View className="flex-row items-center gap-2">
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

            <View className="flex-1">
              <FormInput
                label=""
                placeholder="Search trades, electricians..."
                value={activeFilters.keyword}
                onChangeText={(text) => setActiveFilters((prev) => ({ ...prev, keyword: text, page: 1 }))}
                containerClassName="mb-0"
              />
            </View>

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

        {/* ACTIVE CATEGORY / SUBCATEGORY BANNER */}
        {Boolean(activeFilters.category || activeFilters.serviceType) && (
          <View className="flex-row items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-100">
            <Text className="text-xs font-bold text-blue-800 flex-1 mr-2" numberOfLines={1}>
              {activeFilters.serviceType
                ? `${activeFilters.category} • ${activeFilters.serviceType}`
                : activeFilters.category}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const cleared = { ...activeFilters, category: '', serviceType: '', page: 1 };
                setActiveFilters(cleared);
                setTempFilters(cleared);
              }}
            >
              <Text className="text-xs font-extrabold text-red-500">Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PROVIDER GRID LIST WITH DESKTOP SCROLLBAR */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563EB" size="large" />
          </View>
        ) : (
          <FlatList
            key={`services-grid-${numColumns}`}
            className="flex-1 w-full"
            style={
              Platform.OS === 'web'
                ? { height: screenHeight - 150, maxHeight: screenHeight - 150 }
                : { flex: 1 }
            }
            data={results}
            keyExtractor={(item: any, index) => item._id || `service-${index}`}
            numColumns={numColumns}
            columnWrapperStyle={
              numColumns === 2
                ? { justifyContent: 'space-between' }
                : { justifyContent: 'flex-start', gap: 12 }
            }
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => (
              <CreateServiceCard
                item={item}
                onPress={() => {
                  const serviceProviderId =
                    item.user && typeof item.user === 'object'
                      ? (item.user as any)._id || (item.user as any).id
                      : item.user;

                  router.push({
                    pathname: '/my-service/[serviceId]',
                    params: {
                      serviceId: item._id,
                      employerId: String(serviceProviderId),
                    },
                  });
                }}
              />
            )}
            ListEmptyComponent={
              <View className="items-center justify-center pt-20">
                <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-4 text-base font-semibold">
                  No service providers match your active filters.
                </Text>
              </View>
            }
          />
        )}

        {/* ADVANCED FILTER BOTTOM SHEET (Centered on Desktop) */}
        <Modal
          visible={showFilterSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilterSheet(false)}
        >
          <View className="flex-1 justify-end md:justify-center md:p-6 bg-black/50">
            <View className="w-full max-w-2xl self-center bg-white rounded-t-3xl md:rounded-3xl p-5 max-h-[85%] shadow-xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-extrabold text-gray-900">Filter Services</Text>
                <TouchableOpacity
                  onPress={() => setShowFilterSheet(false)}
                  className="p-1.5 bg-gray-100 rounded-full"
                >
                  <Ionicons name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="mb-4">
                <FormDropdown
                  label="Category"
                  placeholder="All Categories"
                  value={tempFilters.category || ''}
                  onPress={() => setShowCategoryModal(true)}
                />

                {Boolean(tempFilters.category) && (
                  <FormDropdown
                    label="Specialty / Service Type"
                    placeholder="All Specialties"
                    value={tempFilters.serviceType || ''}
                    onPress={() => setShowSubCategoryModal(true)}
                  />
                )}

                <FormDropdown
                  label="Region"
                  placeholder="All Ghana"
                  value={tempFilters.region || ''}
                  onPress={() => setShowRegionModal(true)}
                />

                {Boolean(tempFilters.region) && (
                  <FormDropdown
                    label="District"
                    placeholder="All Districts"
                    value={tempFilters.district || ''}
                    onPress={() => setShowDistrictModal(true)}
                  />
                )}
              </ScrollView>

              <View className="flex-row gap-3 pt-2 border-t border-gray-100">
                <TouchableOpacity
                  onPress={handleResetFilters}
                  className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center justify-center"
                >
                  <Text className="text-gray-800 font-bold text-sm">Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApplyFilters}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 items-center justify-center"
                >
                  <Text className="text-white font-bold text-sm">Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* PICKER MODALS */}
        <FlatListPickerModal
          visible={showCategoryModal}
          title="Select Category"
          data={SERVICE_CATEGORIES}
          onSelect={(val) => handleInputChange('category', val)}
          onClose={() => setShowCategoryModal(false)}
        />

        <FlatListPickerModal
          visible={showSubCategoryModal}
          title="Select Specialty"
          data={activeSubCategories}
          onSelect={(val) => handleInputChange('serviceType', val)}
          onClose={() => setShowSubCategoryModal(false)}
        />

               <FlatListPickerModal
          visible={showRegionModal}
          title="Select Region"
          data={GHANA_REGIONS}
          onSelect={(val) => handleInputChange('region', val)}
          onClose={() => setShowRegionModal(false)}
        />

        <FlatListPickerModal
          visible={showDistrictModal}
          title="Select District"
          data={activeDistricts}
          onSelect={(val) => handleInputChange('district', val)}
          onClose={() => setShowDistrictModal(false)}
        />
      </View>
    </SafeScreen>
  );
};

export default AllServiceScreen;