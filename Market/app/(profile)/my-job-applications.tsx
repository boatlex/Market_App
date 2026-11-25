import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useSearchCandidate, SearchCandidatesFilters } from '../../hooks/useSearchCandidate';
import { useGetMyJobSeekerAds } from '../../hooks/useGetMyjoSeekerAds';
import { FormInput } from '../../components/FormInput';
import { FormDropdown } from '../../components/FormDropdown';
import SeekJobCard from '../../components/lookForJob/SeekJodCard';
import { useAuth } from '../../contexts/authContext';
import { JOB_CATEGORIES } from '../../constants/createJobs';
import FlatListPickerModal from '../../components/FlatListPickerModal';
import {
  GHANA_REGIONS,
  GHANA_DISTRICTS_BY_REGION,
  JOB_TYPES,
  WORK_MODE,
} from '../../constants/seekJob';
import { JobSeekerProfile } from '../../types';


const JobSeekerScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; subCategory?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const initialQuery = params.subCategory || params.category || "";

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'my-ads'>('all');

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeFilters, setActiveFilters] = useState<SearchCandidatesFilters>({
    page: 1,
    limit: 10,
    keyword: "",
    category: params.category || "",
    seekJobType: params.subCategory || "",
    region: "",
    district: "",
    workMode: "",
  });

  const [tempFilters, setTempFilters] = useState<SearchCandidatesFilters>({ ...activeFilters });




  // Inside JobSeekerScreen:
  const numColumns = screenWidth >= 1280 ? 5 : screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const horizontalPadding = 32; // 16px left + 16px right
  const cardGap = 12;
  const cardWidth = (screenWidth - horizontalPadding - (numColumns - 1) * cardGap) / numColumns;


  // Sync incoming route params from HomeScreen SubCategoryModal
  useEffect(() => {
    setActiveTab('all');
    setSearchInput("");
    const updatedFromParams: SearchCandidatesFilters = {
      page: 1,
      limit: 10,
      keyword: "",
      category: params.category || "",
      seekJobType: params.subCategory || "",
      region: "",
      district: "",
      workMode: "",
    };
    setActiveFilters(updatedFromParams);
    setTempFilters(updatedFromParams);
  }, [params.category, params.subCategory]);

  const {
    data: searchData,
    isLoading: isSearchLoading,
    refetch: refetchSearch,
  } = useSearchCandidate(activeFilters);

  const {
    data: myAdsData,
    isLoading: isMyAdsLoading,
    refetch: refetchMyAds,
  } = useGetMyJobSeekerAds();

  const myAdsList: JobSeekerProfile[] = Array.isArray(myAdsData)
    ? myAdsData
    : myAdsData
      ? [myAdsData]
      : [];

  const candidateProfiles: JobSeekerProfile[] =
    activeTab === 'all' ? searchData?.profiles || [] : myAdsList;

  const adsCount =
    activeTab === 'all' ? searchData?.profiles?.length || 0 : myAdsList.length;


  const isLoading = activeTab === 'all' ? isSearchLoading : isMyAdsLoading;
  const currentRefetch = activeTab === 'all' ? refetchSearch : refetchMyAds;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveFilters((prev) => ({ ...prev, keyword: searchInput, page: 1 }));
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);
  const handleFilterInputChange = (field: keyof SearchCandidatesFilters, value: string) => {
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
    const standardReset: SearchCandidatesFilters = {
      page: 1,
      limit: 10,
      keyword: "",
      category: "",
      seekJobType: "",
      region: "",
      district: "",
      workMode: "",
    };
    setSearchInput("");
    setTempFilters(standardReset);
    setActiveFilters(standardReset);
    setShowFilterSheet(false);
  };

  const availableDistricts = tempFilters.region
    ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
    : [];


  return (
    <SafeScreen>
      <View className="flex-1 bg-gray-50">
        {/* TOP HEADER */}
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
              {activeTab === 'all' ? `Available Talent (${adsCount})` : `My Job Ads (${adsCount})`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/apply-for-job" as any)}
            className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="person-add-outline" size={14} color="#FFFFFF" className="mr-1" />
            <Text className="text-white font-bold text-xs">Create Ad</Text>
          </TouchableOpacity>
        </View>

        {/* SUB TAB SWITCH BAR */}
        <View className="flex-row bg-white px-4 pt-2 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`flex-1 pb-3 items-center border-b-2 ${activeTab === 'all' ? 'border-blue-600' : 'border-transparent'}`}
          >
            <Text className={`font-bold text-sm ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-400'}`}>
              All Talents
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('my-ads')}
            className={`flex-1 pb-3 items-center border-b-2 ${activeTab === 'my-ads' ? 'border-blue-600' : 'border-transparent'}`}
          >
            <Text className={`font-bold text-sm ${activeTab === 'my-ads' ? 'text-blue-600' : 'text-gray-400'}`}>
              My Ads
            </Text>
          </TouchableOpacity>
        </View>

        {/* STICKY SEARCH BAR */}
        {activeTab === 'all' && (
          <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white shadow-sm">
            <View className="flex-1 justify-center">
              <FormInput
                label=""
                placeholder="Search skills, profession or name..."
                value={searchInput}
                onChangeText={setSearchInput}
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
        )}

        {/* ACTIVE ROUTE FILTER BANNER */}
        {activeTab === 'all' && (params.category || params.subCategory) && searchInput.length > 0 && (
          <View className="flex-row items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-100">
            <Text className="text-xs font-bold text-blue-800 flex-1 mr-2" numberOfLines={1}>
              {params.category && params.subCategory
                ? `${params.category} • ${params.subCategory}`
                : params.subCategory || params.category}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchInput("");
                setActiveFilters((prev) => ({ ...prev, keyword: "", page: 1 }));
                setTempFilters((prev) => ({ ...prev, keyword: "", page: 1 }));
              }}
            >
              <Text className="text-xs font-extrabold text-red-500">Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TALENT FEED LIST */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2563eb" size="large" />
            <Text className="text-gray-400 text-xs font-semibold mt-2">Loading candidates...</Text>
          </View>
        ) : (
          <FlatList
            key={`seeker-grid-${numColumns}`}
            data={candidateProfiles}
            keyExtractor={(item: JobSeekerProfile) => item._id}
            numColumns={numColumns}
            columnWrapperStyle={{ justifyContent: 'flex-start', gap: cardGap }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            onRefresh={currentRefetch}
            refreshing={isLoading}
            renderItem={({ item }) => (
              <SeekJobCard
                item={item}
                cardWidth={cardWidth}
                onPress={() => {
                  const secureSeekerId = item.user && typeof item.user === 'object'
                    ? (item.user as any)._id || (item.user as any).id
                    : item.user;
                  router.push({
                    pathname: '/seek-job/[id]',
                    params: {
                      id: item._id,
                      jobSeekerId: secureSeekerId
                    }
                  } as any);
                }}
              />
            )}
            ListEmptyComponent={
              <View className="items-center justify-center pt-20">
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-4 text-base font-semibold">
                  {activeTab === 'all'
                    ? "No talent profiles match your search."
                    : "You haven't created a job seeker ad yet."}
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
                <Text className="text-lg font-extrabold text-gray-900">Filter Talents</Text>
                <TouchableOpacity onPress={() => setShowFilterSheet(false)} className="p-1 bg-gray-100 rounded-full">
                  <Ionicons name="close" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                <FormDropdown
                  label="Category"
                  placeholder="Select Category"
                  value={tempFilters.category || ""}
                  onPress={() => setShowCategoryModal(true)}
                />

                <FormDropdown
                  label="Job Type"
                  placeholder="Select Job Type"
                  value={tempFilters.seekJobType || ""}
                  onPress={() => setShowJobTypeModal(true)}
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
        <FlatListPickerModal
          visible={showCategoryModal}
          title="Select Category"
          data={JOB_CATEGORIES} // Import from your constants/seekJob or constants/jobs
          onSelect={(val) => handleFilterInputChange("category", val)}
          onClose={() => setShowCategoryModal(false)}
        />

        <FlatListPickerModal
          visible={showJobTypeModal}
          title="Select Job Type"
          data={JOB_TYPES} // 👈 Use JOB_TYPES directly instead of availableJobTypes
          onSelect={(val) => handleFilterInputChange("seekJobType", val)}
          onClose={() => setShowJobTypeModal(false)}
        />

        <FlatListPickerModal
          visible={showRegionModal}
          title="Choose Region"
          data={GHANA_REGIONS}
          onClose={() => setShowRegionModal(false)}
          onSelect={(item) => handleFilterInputChange("region", item)}
        />

        <FlatListPickerModal
          visible={showDistrictModal}
          title="Choose District"
          data={availableDistricts}
          onClose={() => setShowDistrictModal(false)}
          onSelect={(item) => handleFilterInputChange("district", item)}
        />

        <FlatListPickerModal
          visible={showWorkModeModal}
          title="Choose Work Mode"
          data={WORK_MODE}
          onClose={() => setShowWorkModeModal(false)}
          onSelect={(item) => handleFilterInputChange("workMode", item)}
        />
      </View>
    </SafeScreen>
  );
};

export default JobSeekerScreen;