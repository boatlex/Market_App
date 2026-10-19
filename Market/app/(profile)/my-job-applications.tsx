import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { useSearchCandidate, SearchCandidatesFilters } from '../../hooks/useSearchCandidate';
import { useGetMyJobSeekerAds } from '../../hooks/useGetMyjoSeekerAds'; 
import { FormInput } from '../../components/FormInput';
import SeekJobCard from '../../components/lookForJob/SeekJodCard';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/authContext';

import {
    GHANA_REGIONS,
    GHANA_DISTRICTS_BY_REGION,
    JOB_CATEGORIES,
    WORK_MODE,
} from '../../constants/seekJob';

const JobSeekerScreen = () => {
    const router = useRouter();

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'all' | 'my-ads'>('all');

    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);

    const [searchInput, setSearchInput] = useState("");

    const [activeFilters, setActiveFilters] = useState<SearchCandidatesFilters>({
        page: 1,
        limit: 10,
        keyword: "",
        region: "",
        district: "",
        workMode: ""
    });

    const [tempFilters, setTempFilters] = useState<SearchCandidatesFilters>({ ...activeFilters });

    const {
        data: searchData,
        isLoading: isSearchLoading,
        refetch: refetchSearch,
        isFetching: isSearchFetching
    } = useSearchCandidate(activeFilters);


    const {
        data: myAdsData,
        isLoading: isMyAdsLoading,
        refetch: refetchMyAds,
        isFetching: isMyAdsFetching
    } = useGetMyJobSeekerAds();


    
    const candidateProfiles = activeTab === 'all'
        ? (searchData?.profiles || [])
        : (myAdsData ? [myAdsData] : []);

    
    const adsCount = activeTab === 'all'
        ? (searchData?.profiles?.length || 0)
        : (myAdsData ? 1 : 0);

    const isLoading = activeTab === 'all' ? isSearchLoading : isMyAdsLoading;
    const isFetching = activeTab === 'all' ? isSearchFetching : isMyAdsFetching;
    const currentRefetch = activeTab === 'all' ? refetchSearch : refetchMyAds;


    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setActiveFilters(prev => ({ ...prev, keyword: searchInput, page: 1 }));
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchInput]);

    const handleFilterInputChange = (field: keyof SearchCandidatesFilters, value: string) => {
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
        const standardReset: SearchCandidatesFilters = {
            page: 1,
            limit: 10,
            keyword: "",
            region: "",
            district: "",
            workMode: ""
        };
        setSearchInput("");
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
                        data={data as string[]}
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
                {/* Header Navbar */}
                <View className="w-full border-b border-gray-100 bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
                    <TouchableOpacity onPress={() => router.back()} className="p-1 rounded-full">
                        <Ionicons name='arrow-back' size={26} color={"#1F2937"} />
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
                        <Ionicons name='person-add-outline' size={14} color="#FFFFFF" className="mr-1" />
                        <Text className="text-white font-bold text-xs">Create Ad</Text>
                    </TouchableOpacity>
                </View>

                {/* Sub Tab Switch Bar */}
                <View className="flex-row bg-white px-4 pt-2 border-b border-gray-100">
                    <TouchableOpacity
                        onPress={() => setActiveTab('all')}
                        className={`flex-1 pb-3 items-center border-b-2 ${activeTab === 'all' ? 'border-blue-600' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold text-sm ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-400'}`}>All Talents</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('my-ads')}
                        className={`flex-1 pb-3 items-center border-b-2 ${activeTab === 'my-ads' ? 'border-blue-600' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold text-sm ${activeTab === 'my-ads' ? 'text-blue-600' : 'text-gray-400'}`}>My Ads</Text>
                    </TouchableOpacity>
                </View>

                {/* Sticky Search Inputs Bar - Only visible or functional during Global Search Tab active */}
                {activeTab === 'all' && (
                    <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white shadow-sm">
                        <View className="flex-1 justify-center">
                            <FormInput
                                label=""
                                placeholder="Search talents, skills, roles..."
                                value={searchInput}
                                onChangeText={setSearchInput}
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
                )}

                {/* Main dynamic Stream rendering profiles */}

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#2563eb" size="large" />
                        <Text className="text-gray-400 text-xs font-semibold mt-2">Sieving talent records...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={candidateProfiles}
                        keyExtractor={(item) => item._id || Math.random().toString()}
                        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 60 }}
                        showsVerticalScrollIndicator={false}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
                        onRefresh={currentRefetch}
                        refreshing={isFetching && !isLoading}
                        renderItem={({ item }) => (
                            <SeekJobCard
                                item={item}
                                onPress={() => router.push({
                                    pathname: '/seek-job/[id]',
                                    params: { id: item._id }
                                } as any)}
                            />
                        )}
                        ListEmptyComponent={() => (
                            <View className="flex-1 items-center justify-center mt-20">
                                <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                                <Text className="text-gray-500 font-semibold mt-4">
                                    {activeTab === 'all' ? 'No matching candidates found' : 'You haven\'t posted any job ads yet'}
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* Bottom Sheet Filter Actions Drawer */}
                <Modal visible={showFilterSheet} animationType="slide" transparent>
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-3xl px-5 py-6 space-y-4">
                            <Text className="text-xl font-black text-gray-900 mb-2">Filter Candidates</Text>

                            {/* Region Picker */}
                            <TouchableOpacity
                                onPress={() => setShowRegionModal(true)}
                                className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex-row justify-between"
                            >
                                <Text className="text-gray-700">{tempFilters.region || "Select Region"}</Text>
                                <Ionicons name="chevron-down" size={18} color="#4B5563" />
                            </TouchableOpacity>

                            {/* District Picker */}
                            <TouchableOpacity
                                onPress={() => setShowDistrictModal(true)}
                                disabled={!tempFilters.region}
                                className={`border border-gray-200 rounded-xl p-4 flex-row justify-between ${!tempFilters.region ? 'bg-gray-100 opacity-50' : 'bg-gray-50'
                                    }`}
                            >
                                <Text className="text-gray-700">{tempFilters.district || "Select District"}</Text>
                                <Ionicons name="chevron-down" size={18} color="#4B5563" />
                            </TouchableOpacity>

                            {/* Work Mode Picker */}
                            <TouchableOpacity
                                onPress={() => setShowWorkModeModal(true)}
                                className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex-row justify-between"
                            >
                                <Text className="text-gray-700">{tempFilters.workMode || "Select Work Mode"}</Text>
                                <Ionicons name="chevron-down" size={18} color="#4B5563" />
                            </TouchableOpacity>

                            {/* Actions Buttons Container */}
                            <View className="flex-row space-x-2 gap-2 pt-4">
                                <TouchableOpacity onPress={handleResetFilters} className="flex-1 bg-gray-100 p-4 rounded-xl items-center">
                                    <Text className="text-gray-700 font-bold">Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleApplyFilters} className="flex-1 bg-blue-600 p-4 rounded-xl items-center">
                                    <Text className="text-white font-bold">Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Sub-Selection Choice Item Modals */}
                <FlatListSelectionModal
                    visible={showRegionModal}
                    title="Select Ghana Region"
                    data={GHANA_REGIONS}
                    onSelect={(val) => handleFilterInputChange("region", val)}
                    onClose={() => setShowRegionModal(false)}
                />

                <FlatListSelectionModal
                    visible={showDistrictModal}
                    title="Select District"
                    data={availableDistricts}
                    onSelect={(val) => handleFilterInputChange("district", val)}
                    onClose={() => setShowDistrictModal(false)}
                />

                <FlatListSelectionModal
                    visible={showWorkModeModal}
                    title="Select Work Mode Preference"
                    data={WORK_MODE}
                    onSelect={(val) => handleFilterInputChange("workMode", val)}
                    onClose={() => setShowWorkModeModal(false)}
                />
            </View>
        </SafeScreen>
    );
};

export default JobSeekerScreen;






// import React, { useState } from 'react';
// import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import SafeScreen from '../../components/SafeScreen';
// import { useSearchCandidate, SearchCandidatesFilters } from '../../hooks/useSearchCandidate';
// import { FormInput } from '../../components/FormInput';
// import SeekJobCard from '../../components/lookForJob/SeekJodCard';
// import { useRouter } from 'expo-router';

// import {
//     GHANA_REGIONS,
//     GHANA_DISTRICTS_BY_REGION, // Added missing delimiter comma breakdown
//     JOB_CATEGORIES,
//     WORK_MODE,
// } from '../../constants/seekJob';

// const JobSeekerScreen = () => {
//     const router = useRouter();

//     const [showFilterSheet, setShowFilterSheet] = useState(false);
//     const [showRegionModal, setShowRegionModal] = useState(false);
//     const [showDistrictModal, setShowDistrictModal] = useState(false);
//     const [showCategoryModal, setShowCategoryModal] = useState(false);
//     const [showWorkModeModal, setShowWorkModeModal] = useState(false);

//     // 1. Re-mapped state variables layout strictly onto Candidate Search API parameters
//     const [activeFilters, setActiveFilters] = useState<SearchCandidatesFilters>({
//         page: 1,
//         limit: 10,
//         keyword: "",
//         region: "",
//         district: "",
//         workMode: ""
//     });

//     const [tempFilters, setTempFilters] = useState<SearchCandidatesFilters>({ ...activeFilters });

//     // 2. Invoke candidate tracking search hook
//     const { data, isLoading, refetch, isFetching } = useSearchCandidate(activeFilters);

//     const candidateProfiles = data?.profiles || [];

//     const handleFilterInputChange = (field: keyof SearchCandidatesFilters, value: string) => {
//         setTempFilters(prev => {
//             const updated = { ...prev, [field]: value };
//             if (field === "region") {
//                 updated.district = "";
//             }
//             return updated;
//         });
//     };

//     const handleApplyFilters = () => {
//         setActiveFilters({ ...tempFilters, page: 1 });
//         setShowFilterSheet(false);
//     };

//     const handleResetFilters = () => {
//         const standardReset: SearchCandidatesFilters = {
//             page: 1,
//             limit: 10,
//             keyword: "",
//             region: "",
//             district: "",
//             workMode: ""
//         };
//         setTempFilters(standardReset);
//         setActiveFilters(standardReset);
//         setShowFilterSheet(false);
//     };

//     const FlatListSelectionModal = ({
//         visible,
//         title,
//         data,
//         onSelect,
//         onClose
//     }: {
//         visible: boolean;
//         title: string;
//         data: readonly string[] | string[];
//         onSelect: (value: string) => void;
//         onClose: () => void;
//     }) => (
//         <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//             <View className="flex-1 bg-black/40 justify-end">
//                 <View className="bg-white rounded-t-3xl max-h-[70%] shadow-xl">
//                     <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
//                         <Text className="text-lg font-bold text-gray-900">{title}</Text>
//                         <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
//                             <Ionicons name="close" size={20} color="#4B5563" />
//                         </TouchableOpacity>
//                     </View>
//                     <FlatList
//                         data={data as string[]}
//                         keyExtractor={(item) => item}
//                         renderItem={({ item }) => (
//                             <TouchableOpacity
//                                 className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
//                                 onPress={() => { onSelect(item); onClose(); }}
//                             >
//                                 <Text className="text-base text-gray-700 font-medium">{item}</Text>
//                                 <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
//                             </TouchableOpacity>
//                         )}
//                     />
//                 </View>
//             </View>
//         </Modal>
//     );

//     const availableDistricts = tempFilters.region
//         ? GHANA_DISTRICTS_BY_REGION[tempFilters.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
//         : [];

//     return (
//         <SafeScreen>
//             <View className="flex-1 bg-gray-50">
//                 {/* Header Navbar Layout Container */}
//                 <View className="w-full border-b border-gray-100 bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
//                     <TouchableOpacity
//                         onPress={() => router.back()}
//                         activeOpacity={0.7}
//                         className="p-1 active:bg-gray-100 rounded-full"
//                     >
//                         <Ionicons name='arrow-back' size={26} color={"#1F2937"} />
//                     </TouchableOpacity>

//                     <View className="flex-1 items-center justify-center px-2">
//                         <Text className="font-extrabold text-lg text-gray-900 text-center" numberOfLines={1}>
//                             {`Available Talent (${data?.resultsCount || candidateProfiles.length})`}
//                         </Text>
//                     </View>

//                     {/* Aligned redirection action to push candidates onto Profile Setup Sheets */}
//                     <TouchableOpacity
//                         onPress={() => router.push("/my-job" as any)}
//                         activeOpacity={0.8}
//                         className="bg-blue-600 px-3 py-2 rounded-xl flex-row items-center justify-center shadow-sm active:bg-blue-700"
//                     >
//                         <Ionicons name='person-add-outline' size={14} color="#FFFFFF" className="mr-1" />
//                         <Text className="text-white font-bold text-xs">My Ad</Text>
//                     </TouchableOpacity>
//                 </View>

//                 {/* Sticky Search Parameter Inputs Bar */}
//                 <View className="px-4 py-2 flex-row items-center space-x-2 gap-2 border-b border-gray-100 bg-white shadow-sm">
//                     <View className="flex-1 justify-center">
//                         <FormInput
//                             label=""
//                             placeholder="Search talents, skills, roles or tech..."
//                             value={activeFilters.keyword}
//                             onChangeText={(text) => setActiveFilters(prev => ({ ...prev, keyword: text }))}
//                         />
//                     </View>

//                     <TouchableOpacity
//                         onPress={() => {
//                             setTempFilters({ ...activeFilters });
//                             setShowFilterSheet(true);
//                         }}
//                         className="bg-gray-100 border border-gray-200 rounded-xl items-center justify-center h-12 w-12 active:bg-gray-200"
//                     >
//                         <Ionicons name="options-outline" size={22} color="#1F2937" />
//                     </TouchableOpacity>
//                 </View>

//                 {/* Main Dynamic Talents Rendering Stream */}
//                 {isLoading ? (
//                     <View className="flex-1 items-center justify-center">
//                         <ActivityIndicator color="#2563eb" size="large" />
//                         <Text className="text-gray-400 text-xs font-semibold mt-2">Sieving talent records...</Text>
//                     </View>
//                 ) : (
//                     <FlatList
//                         data={candidateProfiles}
//                         keyExtractor={(item) => item._id}
//                         contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
//                         showsVerticalScrollIndicator={false}
//                         numColumns={2}
//                         columnWrapperStyle={{ justifyContent: 'space-between' }}
//                         refreshing={isFetching}
//                         onRefresh={refetch}
//                         renderItem={({ item }) => (
// <SeekJobCard
//     item={item}
// onPress={() => router.push({
//     pathname: '/my-job/[id]',
//     params: { id: item._id }
// } as any)}
// />
//                         )}
//                         ListEmptyComponent={
//                             <View className="flex-1 items-center justify-center mt-12 px-6">
//                                 <Ionicons name="search-outline" size={40} color="#9CA3AF" />
//                                 <Text className="text-gray-400 text-sm font-medium mt-2 italic text-center">
//                                     No candidate profile indexes match your specified filters.
//                                 </Text>
//                             </View>
//                         }
//                     />
//                 )}

//                 {/* Slidable Overlay Filtering Bottom Sheet Config */}
//                                <Modal visible={showFilterSheet} animationType="slide" transparent>
//                     <View className="flex-1 bg-black/50 justify-end">
//                         <View className="bg-white rounded-t-3xl max-h-[85%] p-6 pb-8">
//                             <View className="flex-row justify-between items-center mb-6 Harman pb-2 border-b border-gray-100">
//                                 <Text className="text-gray-950 font-black text-lg">Filter Profiles</Text>
//                                 <TouchableOpacity onPress={() => setShowFilterSheet(false)}>
//                                     <Ionicons name="close" size={24} color="#4B5563" />
//                                 </TouchableOpacity>
//                             </View>

//                             <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
//                                 {/* Arrangement WorkMode Selector Trigger Row */}
//                                 <Text className="text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Work Preference</Text>
//                                 <TouchableOpacity
//                                     onPress={() => setShowWorkModeModal(true)}
//                                     className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex-row justify-between items-center mb-3"
//                                 >
//                                     <Text className={`text-base font-semibold ${tempFilters.workMode ? 'text-gray-800' : 'text-gray-400'}`}>
//                                         {tempFilters.workMode || "Select preferred arrangement..."}
//                                     </Text>
//                                     <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
//                                 </TouchableOpacity>

//                                 {/* Region Selection Trigger Row */}
//                                 <Text className="text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Region Location</Text>
//                                 <TouchableOpacity
//                                     onPress={() => setShowRegionModal(true)}
//                                     className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex-row justify-between items-center mb-3"
//                                 >
//                                     <Text className={`text-base font-semibold ${tempFilters.region ? 'text-gray-800' : 'text-gray-400'}`}>
//                                         {tempFilters.region || "Select target region..."}
//                                     </Text>
//                                     <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
//                                 </TouchableOpacity>

//                                 {/* District Selection Trigger Row */}
//                                 <Text className="text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Municipal District</Text>
//                                 <TouchableOpacity
//                                     onPress={() => setShowDistrictModal(true)}
//                                     disabled={!tempFilters.region}
//                                     className={`border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex-row justify-between items-center mb-6 ${!tempFilters.region ? 'opacity-50' : ''}`}
//                                 >
//                                     <Text className={`text-base font-semibold ${tempFilters.district ? 'text-gray-800' : 'text-gray-400'}`}>
//                                         {tempFilters.district || "Select municipal district..."}
//                                     </Text>
//                                     <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
//                                 </TouchableOpacity>

//                                 {/* Action Buttons Panel Container Row */}
//                                 <View className="flex-row gap-3 pt-2">
//                                     <TouchableOpacity
//                                         onPress={handleResetFilters}
//                                         className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center justify-center border border-gray-200"
//                                     >
//                                         <Text className="text-gray-700 font-extrabold text-sm">Clear All</Text>
//                                     </TouchableOpacity>
//                                     <TouchableOpacity
//                                         onPress={handleApplyFilters}
//                                         className="flex-1 bg-blue-600 py-3.5 rounded-xl items-center justify-center shadow-sm shadow-blue-500/10 active:bg-blue-700"
//                                     >
//                                         <Text className="text-white font-black text-sm">Apply Filters</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </ScrollView>
//                         </View>
//                     </View>
//                 </Modal>

//                 {/* Sub-Selection Dropdown Lists Layers Modals */}
//                 <FlatListSelectionModal
//                     visible={showRegionModal}
//                     title="Filter by Ghana Region"
//                     data={GHANA_REGIONS}
//                     onSelect={(text) => handleFilterInputChange("region", text)}
//                     onClose={() => setShowRegionModal(false)}
//                 />

//                 <FlatListSelectionModal
//                     visible={showDistrictModal}
//                     title="Filter by Municipal District"
//                     data={availableDistricts}
//                     onSelect={(text) => handleFilterInputChange("district", text)}
//                     onClose={() => setShowDistrictModal(false)}
//                 />

//                 <FlatListSelectionModal
//                     visible={showWorkModeModal}
//                     title="Filter by Arrangement"
//                     data={WORK_MODE}
//                     onSelect={(text) => handleFilterInputChange("workMode", text)}
//                     onClose={() => setShowWorkModeModal(false)}
//                 />
//             </View>
//         </SafeScreen>
//     );
// };

// export default JobSeekerScreen;
