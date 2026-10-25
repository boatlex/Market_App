import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';

// Import Custom Render Components
import { MyProductsList } from '../../components/myActivity/MyProductsList';
import { MyJobsList } from '../../components/myActivity/MyJobsList';
import { MyServicesList } from '../../components/myActivity/MyServicesList';
import { MyJobSeekerProfileList } from '../../components/myActivity/MyJobSeekerProfileList';

// Import Dynamic Sync Operation Hooks
import { useGetMyProviderProfile } from '../../hooks/useGetMyProviderProfile';
import { useDeleteServiceProvider } from '../../hooks/useDeleteServiceProvider';
import { useDeleteJobSeekerProfile } from '../../hooks/useDeleteJobSeekerProfile';
import { useDeleteJob } from '../../hooks/useDeleteJob';
import useListings from '../../hooks/useListings';
import { useGetJobs } from '../../hooks/useGetJobs';
import { useGetMyJobSeekerAds } from '../../hooks/useGetMyjoSeekerAds';

type TabType = 'products' | 'jobs' | 'services' | 'jobseeker';

const MyActivityScreen = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('products');

    // ⚡ REAL SERVER DATA STREAMS LOADING ENGINE
    const { data: serviceData, isLoading: loadingService } = useGetMyProviderProfile();
    const { data: jobsResponse, isLoading: loadingJobs } = useGetJobs();
    const { data: jobseekers, isLoading: loadingJobseeker } = useGetMyJobSeekerAds();
    const { products: userProducts, deleteProduct, deletingProductId } = useListings();

    // ⚡ REAL MUTATIONS PIPELINE CONNECTORS
    const deleteServiceMutation = useDeleteServiceProvider();
    const deleteJobSeekerMutation = useDeleteJobSeekerProfile();
    const deleteJobMutation = useDeleteJob();



    // ✅ FIXED: Safely unpack the inner array list parameter structure from the hook's return envelope wrapper
    const myJobs = Array.isArray(jobsResponse)
        ? jobsResponse
        : (jobsResponse?.jobs || []);

    const myProducts = userProducts || [];

    const myServices = serviceData?.profile ? [serviceData.profile] : [];
    const myJobSeekerProfiles = Array.isArray(jobseekers)
        ? jobseekers
        : (jobseekers ? [jobseekers] : []);
    const handleProductDelete = (id: string) => {
        Alert.alert("Wipe Product Listing?", "This will remove your item permanently from the marketplace.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteProduct(id);
                        Alert.alert("Success 🎉", "Marketplace product item removed cleanly.");
                    } catch (err) {
                        Alert.alert("Error", "Could not remove product listing.");
                    }
                }
            }
        ]);
    };

    const handleJobDelete = (id: string) => {
        Alert.alert("Remove Job Post?", "This will close the vacancy opening and wipe applicant listings.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteJobMutation.mutateAsync(id);
                        Alert.alert("Success 🎉", "Job vacancy opening purged from index listings.");
                    } catch (err) {
                        Alert.alert("Error", "Could not remove job post vacancy opening.");
                    }
                }
            }
        ]);
    };

    const handleServiceDelete = (id: string) => {
        Alert.alert("Delete Trade Profile? ⚠️", "Wipes portfolio image history assets from our directory database permanently.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Wipe Profile",
                style: "destructive",
                onPress: () => {
                    deleteServiceMutation.mutate(undefined, {
                        onSuccess: () => Alert.alert("Success 🎉", "Business trade profile successfully removed.")
                    });
                }
            }
        ]);
    };

    const handleJobSeekerDelete = (id: string) => {
        Alert.alert(
            "Wipe Candidate Profile? ⚠️",
            "This will permanently delete your resume file and PDF attachments from our active candidate search pools.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Record",
                    style: "destructive",
                    onPress: () => {
                        deleteJobSeekerMutation.mutate(undefined, {
                            onSuccess: () => Alert.alert("Success 🎉", "Candidate resume card successfully purged.")
                        });
                    }
                }
            ]
        );
    };

    const isMutationLoading = deleteServiceMutation.isPending || deleteJobSeekerMutation.isPending || deleteJobMutation.isPending || !!deletingProductId;
    const isLoadingMaster = loadingService || loadingJobs || loadingJobseeker || isMutationLoading;

    return (
        <SafeScreen>
            <View className="flex-1 bg-gray-50/50">

                {/* Sticky Dashboard Section Header */}
                <View className="bg-white border-b border-gray-100 px-6 py-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="p-1 bg-gray-50 border border-gray-100 rounded-full mr-3">
                            <Ionicons name="arrow-back" size={20} color="#1F2937" />
                        </TouchableOpacity>
                        <Text className="text-xl font-black text-gray-900">My Listings Dashboard</Text>
                    </View>
                </View>

                {/* Horizontal Navigation Segmented Tab Pill Controller Strip */}
                <View className="bg-white py-3 border-b border-gray-100">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
                        {(['products', 'jobs', 'services', 'jobseeker'] as TabType[]).map((tab) => {
                            const isActive = activeTab === tab;

                            const tabLabelMap: Record<TabType, string> = {
                                products: "Market Ads",
                                jobs: "Hiring Vacancies",
                                services: "Trade Business",
                                jobseeker: "My Resume File"
                            };

                            return (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-full border ${isActive ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-gray-50 border-gray-100 active:bg-gray-100'}`}
                                >
                                    <Text className={`text-xs font-black ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                        {tabLabelMap[tab]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Tab View Container List Router Switch Mapping */}
                <View className="flex-1 p-4">
                    {isLoadingMaster ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <ActivityIndicator color="#2563EB" size="large" />
                        </View>
                    ) : (
                        <>
                            {activeTab === 'products' && (
                                <MyProductsList
                                    products={myProducts}
                                    onEdit={(item) => router.push({ pathname: "/post-product", params: { productData: JSON.stringify(item) } } as any)}
                                    onDelete={handleProductDelete}
                                />
                            )}
                            {activeTab === 'jobs' && (
                                <MyJobsList
                                    jobs={myJobs as any}
                                    onEdit={(item) => router.push({ pathname: "/post-job", params: { jobData: JSON.stringify(item) } } as any)}
                                    onDelete={handleJobDelete}
                                />
                            )}

                            {activeTab === 'services' && (
                                <MyServicesList
                                    services={myServices}
                                    onEdit={(item) => router.push({ pathname: "/post-service", params: { serviceProviderData: JSON.stringify(item) } } as any)}
                                    onDelete={handleServiceDelete}
                                />
                            )}

                            {activeTab === 'jobseeker' && (
                                <MyJobSeekerProfileList
                                    profiles={myJobSeekerProfiles}
                                    onEdit={(item) => router.push({ pathname: "/look-for-job", params: { seekJobData: JSON.stringify(item) } } as any)}
                                    onDelete={handleJobSeekerDelete}
                                />
                            )}
                        </>
                    )}
                </View>
                {/* Tab View Container List Router Switch Mapping */}
                <View className="flex-1 p-4">
                    {isLoadingMaster ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <ActivityIndicator color="#2563EB" size="large" />
                        </View>
                    ) : (
                                               <>
                            {activeTab === 'products' && (
                                <MyProductsList
                                    products={myProducts}
                                    // Maps editing parameters directly to the serialized product page structure
                                    onEdit={(item) => router.push({
                                        pathname: "/post-product" as any,
                                        params: { productData: JSON.stringify(item) }
                                    })}
                                    onDelete={handleProductDelete}
                                />
                            )}
                            {activeTab === 'jobs' && (
                                <MyJobsList
                                    jobs={myJobs as any}
                                    // Maps editing parameters directly to the serialized vacancy creation structure
                                    onEdit={(item) => router.push({
                                        pathname: "/post-job" as any,
                                        params: { jobData: JSON.stringify(item) }
                                    })}
                                    onDelete={handleJobDelete}
                                />
                            )}
                            {activeTab === 'services' && (
                                <MyServicesList
                                    services={myServices}
                                    // Maps editing parameters directly to the serialized service provider structure
                                    onEdit={(item) => router.push({
                                        pathname: "/post-service" as any,
                                        params: { serviceProviderData: JSON.stringify(item) }
                                    })}
                                    onDelete={handleServiceDelete}
                                />
                            )}
                            {activeTab === 'jobseeker' && (
                                <MyJobSeekerProfileList
                                    profiles={myJobSeekerProfiles}
                                    // Maps editing parameters directly to the serialized candidate profile structure
                                    onEdit={(item) => router.push({
                                        pathname: "/look-for-job" as any,
                                        params: { seekJobData: JSON.stringify(item) }
                                    })}
                                    onDelete={handleJobSeekerDelete}
                                />
                            )}
                        </>
                    )}
                </View>
            </View>
        </SafeScreen>
    );
};

export default MyActivityScreen;
