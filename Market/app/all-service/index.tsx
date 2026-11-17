import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useSearchServiceProviders, SearchProvidersParams } from '../../hooks/useSearchServiceProviders';
import { FormInput } from '../../components/FormInput';
import { CreateServiceCard } from '../../components/createService/CreateServiceCard';
import { FormDropdown } from '../../components/FormDropdown';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  SERVICE_CATEGORIES,
  SUB_CATEGORIES_BY_CATEGORY,
} from '../../constants/createServices';

const FlatListPickerModal = ({
  visible,
  title,
  data,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  data: readonly string[] | string[];
  onSelect: (item: string) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
    <View className="flex-1 justify-end bg-black/50">
      <View className="bg-white rounded-t-3xl h-[65%] pb-6">
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
          <Text className="text-gray-900 font-black text-base">{title}</Text>
          <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
            <Ionicons name="close" size={18} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data as string[]}
          keyExtractor={(item) => item}
          className="flex-1"
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 40 }}
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
          showsVerticalScrollIndicator={true}
        />
      </View>
    </View>
  </Modal>
);

export const AllServiceScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; subCategory?: string }>();

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
      <View className="flex-1 bg-gray-50">
        {/* TOP APP BAR */}
        <View className="w-full border-b border-gray-100 bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="p-1 active:bg-gray-100 rounded-full"
          >
            <Ionicons name="arrow-back" size={26} color="#1F2937" />
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
        {(activeFilters.category || activeFilters.serviceType) && (
          <View className="flex-row items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-100">
            <Text className="text-xs font-bold text-blue-800 flex-1 mr-2" numberOfLines={1}>
              {activeFilters.serviceType
                ? `${activeFilters.category} • ${activeFilters.serviceType}`
                : activeFilters.category}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const cleared = { ...activeFilters, category: "", serviceType: "", page: 1 };
                setActiveFilters(cleared);
                setTempFilters(cleared);
              }}
            >
              <Text className="text-xs font-extrabold text-red-500">Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PROVIDER GRID LIST */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563EB" size="large" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item: any, index) => item._id || `service-${index}`}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}

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

        {/* ADVANCED FILTER BOTTOM SHEET */}
        <Modal visible={showFilterSheet} animationType="slide" transparent={true} onRequestClose={() => setShowFilterSheet(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-extrabold text-gray-900">Filter Services</Text>
                <TouchableOpacity onPress={() => setShowFilterSheet(false)} className="p-1 bg-gray-100 rounded-full">
                  <Ionicons name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                <FormDropdown
                  label="Category"
                  placeholder="All Categories"
                  value={tempFilters.category || ""}
                  onPress={() => setShowCategoryModal(true)}
                />

                {tempFilters.category ? (
                  <FormDropdown
                    label="Specialty / Service Type"
                    placeholder="All Specialties"
                    value={tempFilters.serviceType || ""}
                    onPress={() => setShowSubCategoryModal(true)}
                  />
                ) : null}

                <FormDropdown
                  label="Region"
                  placeholder="All Ghana"
                  value={tempFilters.region || ""}
                  onPress={() => setShowRegionModal(true)}
                />

                {tempFilters.region ? (
                  <FormDropdown
                    label="District"
                    placeholder="All Districts"
                    value={tempFilters.district || ""}
                    onPress={() => setShowDistrictModal(true)}
                  />
                ) : null}
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
          visible={showRegionModal}
          title="Choose Region"
          data={GHANA_REGIONS}
          onClose={() => setShowRegionModal(false)}
          onSelect={(item) => {
            handleInputChange("region", item);
            if (!showFilterSheet) {
              setActiveFilters((prev) => ({ ...prev, region: item, district: "", page: 1 }));
            }
          }}
        />

        <FlatListPickerModal
          visible={showDistrictModal}
          title="Choose District"
          data={activeDistricts}
          onClose={() => setShowDistrictModal(false)}
          onSelect={(item) => {
            handleInputChange("district", item);
            if (!showFilterSheet) {
              setActiveFilters((prev) => ({ ...prev, district: item, page: 1 }));
            }
          }}
        />

        <FlatListPickerModal
          visible={showCategoryModal}
          title="Choose Service Category"
          data={SERVICE_CATEGORIES}
          onClose={() => setShowCategoryModal(false)}
          onSelect={(item) => handleInputChange("category", item)}
        />

        <FlatListPickerModal
          visible={showSubCategoryModal}
          title="Choose Specialty"
          data={activeSubCategories}
          onClose={() => setShowSubCategoryModal(false)}
          onSelect={(item) => handleInputChange("serviceType", item)}
        />
      </View>
    </SafeScreen>
  );
};

export default AllServiceScreen;

