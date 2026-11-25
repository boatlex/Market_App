import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useGetJobs, GetJobsFilters, JobItem } from '../../hooks/useGetJobs';
import { FormInput } from '../../components/FormInput';
import { FormDropdown } from '../../components/FormDropdown';
import JobCard from '../../components/createJob/Jobcard';
import FlatListPickerModal from '../../components/FlatListPickerModal';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  JOB_CATEGORIES,
  WORK_MODE,
} from '../../constants/createJobs';


const JobsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; subCategory?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);

  const [activeFilters, setActiveFilters] = useState<GetJobsFilters>({
    page: 1,
    limit: 10,
    search: params.subCategory || "",
    category: params.category || "",
    workMode: "",
    region: "",
    district: "",
  });

  const [tempFilters, setTempFilters] = useState<GetJobsFilters>({ ...activeFilters });



  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;

  useEffect(() => {
    const incomingFilters: GetJobsFilters = {
      page: 1,
      limit: 10,
      search: params.subCategory || "",
      category: params.category || "",
      workMode: "",
      region: "",
      district: "",
    };
    setActiveFilters(incomingFilters);
    setTempFilters(incomingFilters);
  }, [params.category, params.subCategory]);

  const { data, isLoading, refetch } = useGetJobs(activeFilters);
  const jobListings = data?.jobs || [];

  const handleFilterInputChange = (field: keyof GetJobsFilters, value: string) => {
    setTempFilters((prev) => {
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
    const standardReset: GetJobsFilters = {
      page: 1,
      limit: 10,
      search: "",
      category: "",
      workMode: "",
      region: "",
      district: "",
    };
    setTempFilters(standardReset);
    setActiveFilters(standardReset);
    setShowFilterSheet(false);
  };

  const availableDistricts = tempFilters.region
    ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
    : [];

  return (

    <SafeScreen >
      <View className="flex-1 bg-gray-50 overflow-hidden"
        style={
          Platform.OS === 'web'
            ? { height: screenHeight - 140, maxHeight: screenHeight - 140 }
            : { flex: 1 }
        }
      >
        {/* TOP HEADER */}
        <View className="w-full border-b border-gray-100 bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any); 
              }
            }}
            activeOpacity={0.7}
            className="p-1 active:bg-gray-100 rounded-full"
          >
            <Ionicons name="arrow-back" size={26} color="#1F2937" />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-extrabold text-lg text-gray-900 text-center" numberOfLines={1}>
              {`${jobListings.length <= 1 ? "Posted Job" : "Posted Jobs"} (${jobListings.length})`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/post-jobs" as any)}
            activeOpacity={0.8}
            className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center justify-center shadow-sm shadow-blue-500/20 active:bg-blue-700"
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" className="mr-1" />
            <Text className="text-white font-bold text-xs">Post Job</Text>
          </TouchableOpacity>
        </View>

        {/* STICKY SEARCH BAR */}
        <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white shadow-sm">
          <View className="flex-1 justify-center">
            <FormInput
              label=""
              placeholder="Search job title, keywords or company..."
              value={activeFilters.search}
              onChangeText={(text) => setActiveFilters((prev) => ({ ...prev, search: text, page: 1 }))}
              containerClassName="mb-0"
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              setTempFilters({ ...activeFilters });
              setShowFilterSheet(true);
            }}
            className="bg-gray-100 border border-gray-200 rounded-xl items-center justify-center h-12 w-12 active:bg-gray-200"
          >
            <Ionicons name="options-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* ACTIVE FILTER BANNER */}
        {Boolean(activeFilters.category || activeFilters.search) && (
          <View className="flex-row items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-100">
            <Text className="text-xs font-bold text-blue-800 flex-1 mr-2" numberOfLines={1}>
              {activeFilters.category && activeFilters.search
                ? `${activeFilters.category} • ${activeFilters.search}`
                : activeFilters.category || `Search: "${activeFilters.search}"`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const cleared = { ...activeFilters, category: "", search: "", page: 1 };
                setActiveFilters(cleared);
                setTempFilters(cleared);
              }}
            >
              <Text className="text-xs font-extrabold text-red-500">Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* JOB FEED LIST */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563eb" size="large" />
            <Text className="text-gray-400 text-xs font-semibold mt-2">Fetching active vacancies...</Text>
          </View>
        ) : (
          <FlatList
            key={`jobs-grid-${numColumns}`}
             style={
                Platform.OS === 'web'
                  ? { height: screenHeight - 140, maxHeight: screenHeight - 140 }
                  : { flex: 1 }
              }
            data={jobListings}
            keyExtractor={(item: JobItem) => item._id}
            numColumns={numColumns}
            columnWrapperStyle={{ justifyContent: 'flex-start', gap: 12 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            refreshing={isLoading}
            onRefresh={refetch}
            renderItem={({ item }) => (
              <JobCard
                item={item}
                onPress={() => {
                  const secureEmployerId = item.employer && typeof item.employer === 'object'
                    ? (item.employer as any)._id || (item.employer as any).id
                    : item.employer
                  router.push({
                    pathname: '/my-job/[id]' as any,
                    params: {
                      id: item._id,
                      employerId: String(secureEmployerId)
                    }
                  });
                }}
              />
            )}
            ListEmptyComponent={
              <View className="items-center justify-center pt-20">
                <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-4 text-base font-semibold">
                  No jobs match your active filters.
                </Text>
              </View>
            }
          />
        )}

        {/* FILTER SHEET MODAL */}
        <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-extrabold text-gray-900">Filter Jobs</Text>
                <TouchableOpacity onPress={() => setShowFilterSheet(false)} className="p-1 bg-gray-100 rounded-full">
                  <Ionicons name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={Platform.OS === 'web'} className="mb-4">
                <FormDropdown
                  label="Category"
                  placeholder="All Job Categories"
                  value={tempFilters.category || ""}
                  onPress={() => setShowCategoryModal(true)}
                />

                <FormDropdown
                  label="Work Mode"
                  placeholder="All Work Modes"
                  value={tempFilters.workMode || ""}
                  onPress={() => setShowWorkModeModal(true)}
                />

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

        {/* SELECTION PICKERS */}
        {showRegionModal && (
          <FlatListPickerModal
            visible={showRegionModal}
            title="Choose Region"
            data={GHANA_REGIONS}
            onClose={() => setShowRegionModal(false)}
            onSelect={(item) => handleFilterInputChange("region", item)}
          />
        )}

        {showDistrictModal && (
          <FlatListPickerModal
            visible={showDistrictModal}
            title="Choose District"
            data={availableDistricts}
            onClose={() => setShowDistrictModal(false)}
            onSelect={(item) => handleFilterInputChange("district", item)}
          />
        )}

        {showCategoryModal && (
          <FlatListPickerModal
            visible={showCategoryModal}
            title="Choose Category"
            data={JOB_CATEGORIES}
            onClose={() => setShowCategoryModal(false)}
            onSelect={(item) => handleFilterInputChange("category", item)}
          />
        )}

        {showWorkModeModal && (
          <FlatListPickerModal
            visible={showWorkModeModal}
            title="Choose Work Mode"
            data={WORK_MODE}
            onClose={() => setShowWorkModeModal(false)}
            onSelect={(item) => handleFilterInputChange("workMode", item)}
          />
        )}

      </View>
    </SafeScreen>
  );
};

export default JobsScreen;
