import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { useGetJobs, GetJobsFilters, JobItem } from '../../hooks/useGetJobs';
import { FormInput } from '../../components/FormInput';
import JobCard from '../../components/createJob/Jobcard'; // FIXED: Uncommented and ensured correct import mapping
import { useRouter } from 'expo-router';

import {
    GHANA_REGIONS,
    GHANA_DISTRICTS_BY_REGION,
    JOB_CATEGORIES,
    WORK_MODE,
} from '../../constants/createJobs';


const JobsScreen = () => {
    const router = useRouter();


    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);

    
    const [activeFilters, setActiveFilters] = useState<GetJobsFilters>({
        page: 1,
        limit: 10,
        search: "",
        category: "",
        workMode: "",
        region: "",
        district: ""
    });

    
    const [tempFilters, setTempFilters] = useState<GetJobsFilters>({ ...activeFilters });

    
    const { data, isLoading, refetch } = useGetJobs(activeFilters);

    
    const jobListings = data?.jobs || [];

    const handleFilterInputChange = (field: keyof GetJobsFilters, value: string) => {
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
        const standardReset: GetJobsFilters = {
            page: 1,
            limit: 10,
            search: "",
            category: "",
            workMode: "",
            region: "",
            district: ""
        };
        setTempFilters(standardReset);
        setActiveFilters(standardReset);
        setShowFilterSheet(false);
    };

    
    const FlatListSelectionModal = ({
        visible,
        title,
        data,
        onSelect,
        onClose
    }: {
        visible: boolean;
        title: string;
        data: readonly string[] | string[];
        onSelect: (value: string) => void;
        onClose: () => void;
    }) => (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/40 justify-end">
                <View className="bg-white rounded-t-3xl max-h-[70%] shadow-xl">
                    <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900">{title}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
                            <Ionicons name="close" size={20} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                onPress={() => { onSelect(item); onClose(); }}
                            >
                                <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );


    const availableDistricts = tempFilters.region
        ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
        : [];

    return (
        <SafeScreen>
            <View className="flex-1 bg-gray-50">
                {/* Header Layout Component Container */}
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
                            {`${jobListings.length <= 1 ? "Posted Job" : "Posted Jobs"} (${jobListings.length})`}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/post-jobs" as any)}
                        activeOpacity={0.8}
                        className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center justify-center shadow-sm shadow-blue-500/20 active:bg-blue-700"
                    >
                        <Ionicons name='add-circle-outline' size={16} color="#FFFFFF" className="mr-1" />
                        <Text className="text-white font-bold text-xs">Post Job</Text>
                    </TouchableOpacity>

                </View>


                {/* Sticky Search Header Bar */}
                <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white shadow-sm">
                    <View className="flex-1 justify-center">
                        <FormInput
                            label=""
                            placeholder="Search job title, keywords or company..."
                            value={activeFilters.search}
                            onChangeText={(text) => setActiveFilters(prev => ({ ...prev, search: text }))}
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

                {/* Job Feed List Layout Frame */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#2563eb" size="large" />
                        <Text className="text-gray-400 text-xs font-semibold mt-2">Fetching active vacancies...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={jobListings}
                        keyExtractor={(item: JobItem) => item._id}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
                        showsVerticalScrollIndicator={false}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        refreshing={isLoading}
                        onRefresh={refetch}
                        renderItem={({ item }) => (
                            <JobCard
                                item={item}
                                onPress={() => {
                                    const secureEmployerId = item.employer && typeof item.employer === 'object'
                                        ? (item.employer as any)._id || (item.employer as any).id
                                        : item.employer;

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
                        ListFooterComponent={() => (
                            jobListings.length > 0 ? (
                                <Text className="text-gray-400 text-center text-xs py-6 font-medium">
                                    You've caught up with all active listings! 🎉
                                </Text>
                            ) : null
                        )}
                        ListEmptyComponent={
                            <View className="items-center justify-center pt-24 px-6">
                                <Ionicons name="briefcase-outline" size={54} color="#9CA3AF" />
                                <Text className="text-gray-800 font-bold text-lg mt-4 text-center">No jobs found</Text>
                                <Text className="text-gray-400 text-sm mt-1 text-center">Try adjusting your filters or search keywords.</Text>
                            </View>
                        }
                    />
                )}

                {/* Master Operational Filter Sheet Slide Overlay */}
                <Modal visible={showFilterSheet} animationType="slide" transparent={false}>
                    <SafeScreen>
                        <View className="flex-1 bg-white">
                            {/* Header Action Menu Toolbar */}
                            <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                                <TouchableOpacity onPress={() => setShowFilterSheet(false)}>
                                    <Ionicons name="close" size={26} color="#1F2937" />
                                </TouchableOpacity>
                                <Text className="text-lg font-bold text-gray-900">Filter Vacancies</Text>
                                <TouchableOpacity onPress={handleResetFilters}>
                                    <Text className="text-sm font-bold text-red-600">Clear All</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Form Input Custom Picker Select Fields */}
                            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                                {/* Ghana Region Field */}
                                <View className="mb-5">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Region</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowRegionModal(true)}
                                        className="flex-row justify-between items-center h-12 px-4 border border-gray-200 rounded-xl bg-gray-50/50"
                                    >
                                        <Text className={`text-base ${tempFilters.region ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {tempFilters.region || "Select Region"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                {/* Ghana District Field (Conditional on Region selection) */}
                                <View className="mb-5">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">District / Locality</Text>
                                    <TouchableOpacity
                                        onPress={() => tempFilters.region ? setShowDistrictModal(true) : null}
                                        disabled={!tempFilters.region}
                                        className={`flex-row justify-between items-center h-12 px-4 border border-gray-200 rounded-xl ${tempFilters.region ? 'bg-gray-50/50' : 'bg-gray-100 opacity-60'}`}
                                    >
                                        <Text className={`text-base ${tempFilters.district ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {tempFilters.region
                                                ? (tempFilters.district || "Select District")
                                                : "Select a region first"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                {/* Job Category Field */}
                                <View className="mb-5">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Job Category</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowCategoryModal(true)}
                                        className="flex-row justify-between items-center h-12 px-4 border border-gray-200 rounded-xl bg-gray-50/50"
                                    >
                                        <Text className={`text-base ${tempFilters.category ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {tempFilters.category || "Select Industry Category"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                {/* Work Mode Field */}
                                <View className="mb-5">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">Work Mode</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowWorkModeModal(true)}
                                        className="flex-row justify-between items-center h-12 px-4 border border-gray-200 rounded-xl bg-gray-50/50"
                                    >
                                        <Text className={`text-base ${tempFilters.workMode ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {tempFilters.workMode || "Select Work Mode (e.g. Remote)"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                            {/* Bottom Sticky Action Footer Button */}
                            <View className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
                                <TouchableOpacity
                                    onPress={handleApplyFilters}
                                    className="bg-blue-600 h-12 rounded-xl items-center justify-center active:bg-blue-700 shadow-sm"
                                >
                                    <Text className="text-white text-base font-bold">Apply Active Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeScreen>
                </Modal>

                {/* =========================================================
            SECONDARY SELECTION MODALS FOR EACH ARRAY DATA INPUT FLUID
            ========================================================= */}
                <FlatListSelectionModal
                    visible={showRegionModal}
                    title="Select Ghana Region"
                    data={GHANA_REGIONS}
                    onSelect={(val) => handleFilterInputChange("region", val)}
                    onClose={() => setShowRegionModal(false)}
                />

                <FlatListSelectionModal
                    visible={showDistrictModal}
                    title={`Districts in ${tempFilters.region}`}
                    data={tempFilters.region ? (GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []) : []}
                    onSelect={(val) => handleFilterInputChange("district", val)}
                    onClose={() => setShowDistrictModal(false)}
                />

                <FlatListSelectionModal
                    visible={showCategoryModal}
                    title="Select Industry"
                    data={JOB_CATEGORIES}
                    onSelect={(val) => handleFilterInputChange("category", val)}
                    onClose={() => setShowCategoryModal(false)}
                />

                <FlatListSelectionModal
                    visible={showWorkModeModal}
                    title="Select Work Setup Arrangement"
                    data={WORK_MODE}
                    onSelect={(val) => handleFilterInputChange("workMode", val)}
                    onClose={() => setShowWorkModeModal(false)}
                />

            </View>
        </SafeScreen>
    );
};

export default JobsScreen;
