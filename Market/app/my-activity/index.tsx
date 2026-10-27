import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Custom Render Components
import { MyProductsList } from '../../components/myActivity/MyProductsList';
import { MyJobsList } from '../../components/myActivity/MyJobsList';
import { MyServicesList } from '../../components/myActivity/MyServicesList';
import { MyJobSeekerProfileList } from '../../components/myActivity/MyJobSeekerProfileList';

// Integrated Data & Sync Hooks
import { useGetMyProviderProfile } from '../../hooks/useGetMyProviderProfile';
import { useDeleteServiceProvider } from '../../hooks/useDeleteServiceProvider';
import { useDeleteJobSeekerProfile } from '../../hooks/useDeleteJobSeekerProfile';
import { useDeleteJob } from '../../hooks/useDeleteJob';
import useListings from '../../hooks/useListings';
import { useGetJobs } from '../../hooks/useGetJobs';
import { useGetMyJobSeekerAds } from '../../hooks/useGetMyjoSeekerAds';

type TabType = 'jobs' | 'products' | 'services' | 'jobseeker';

export default function MyActivityScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('jobs');
    const [isNavigating, setIsNavigating] = useState(false);

    // 🔄 Data Fetching Hook Implementations (Corrected for your custom return shapes)
    const { products: myProducts, isLoading: loadingProducts, refetch: refetchProducts } = useListings();
    const { data: myJobs, isLoading: loadingJobs, refetch: refetchJobs } = useGetJobs();
    const { data: myServices, isLoading: loadingServices, refetch: refetchServices } = useGetMyProviderProfile();
    const { data: myJobSeekerProfiles, isLoading: loadingJobSeekers, refetch: refetchJobSeekers } = useGetMyJobSeekerAds();

    // 🗑️ Delete Hook Mutations (Corrected to use v5 'isPending')
    const { mutate: deleteJob, isPending: isDeletingJob } = useDeleteJob();
    const { mutate: deleteService, isPending: isDeletingService } = useDeleteServiceProvider();
    const { mutate: deleteJobSeeker, isPending: isDeletingJobSeeker } = useDeleteJobSeekerProfile();

    // Centralized Navigation Dispatcher to fix the context-loss crash
    const handleEditRedirect = (targetPath: string, paramKey: string, targetItem: any) => {
        if (isNavigating) return;
        setIsNavigating(true);

        setTimeout(() => {
            try {
                router.push({
                    pathname: targetPath as any,
                    params: { [paramKey]: JSON.stringify(targetItem) }
                });
            } catch (error) {
                console.error("Navigation context lost during dynamic switch:", error);
            } finally {
                setIsNavigating(false);
            }
        }, 16);
    };

    // 🛠️ Safe Deletion Triggers
    const handleJobDelete = (id: string) => {
        Alert.alert("Delete Listing", "Are you sure you want to remove this job?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteJob(id, { onSuccess: () => refetchJobs() }) }
        ]);
    };

    const handleProductDelete = (id: string) => {
        Alert.alert("Delete Product", "Are you sure you want to remove this product?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => console.log('Delete product ID:', id) }
        ]);
    };

    const handleServiceDelete = (id: string) => {
        Alert.alert("Delete Service", "Are you sure you want to remove this service profile?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteService(undefined as any, { onSuccess: () => refetchServices() })
            }
        ]);
    };
    const handleJobSeekerDelete = (id: string) => {
        Alert.alert("Delete Profile", "Are you sure you want to remove this seeker profile?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteJobSeeker({ id } as any, { onSuccess: () => refetchJobSeekers() })
            }
        ]);
    };


    // Check if any tab content is loading or processing a deletion mutation
    const isGlobalLoading =
        loadingProducts ||
        loadingJobs ||
        loadingServices ||
        loadingJobSeekers ||
        isDeletingJob ||
        isDeletingService ||
        isDeletingJobSeeker;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1 bg-gray-50">

                {/* Tab Header Selector Bar */}
                <View className="flex-row bg-white px-2 py-2 border-b border-gray-100 gap-1">
                    {/* 🔑 Fixed compilation error: Cast explicitly as TabType array */}
                    {(['jobs', 'products', 'services', 'jobseeker'] as TabType[]).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                disabled={isNavigating || isGlobalLoading}
                                onPress={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 items-center rounded-xl ${isActive ? 'bg-gray-950' : 'bg-transparent'
                                    }`}
                            >
                                <Text className={`text-xs font-extrabold capitalize ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                    {tab === 'jobseeker' ? 'Job Seeker' : tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Primary List Display Container */}
                <View className="flex-1 px-4 pt-2">
                    {(isNavigating || isGlobalLoading) && (
                        <View className="absolute inset-0 bg-gray-50/60 items-center justify-center z-50">
                            <ActivityIndicator size="small" color="#000000" />
                        </View>
                    )}

                    {activeTab === 'products' && (
                        <MyProductsList
                            products={myProducts || []}
                            onEdit={(item) => handleEditRedirect("/(tabs)/sell", "productData", item)}
                            onDelete={handleProductDelete}
                        />
                    )}

                    {activeTab === 'jobs' && (
                        <MyJobsList
                            jobs={(myJobs as any)?.data || (myJobs as any)?.jobs || []}
                            onEdit={(item) => handleEditRedirect("/post-jobs", "jobData", item)}
                            onDelete={handleJobDelete}
                        />
                    )}


                    {activeTab === 'services' && (
                        <MyServicesList
                            services={myServices?.data || []}
                            onEdit={(item) => handleEditRedirect("/post-service", "serviceProviderData", item)}
                            onDelete={handleServiceDelete}
                        />
                    )}


                    
                    {activeTab === 'jobseeker' && (
                        <MyJobSeekerProfileList
                            profiles={myJobSeekerProfiles || []}
                            onEdit={(item) => handleEditRedirect("/apply-for-job", "seekJobData", item)}
                            onDelete={handleJobSeekerDelete}
                        />
                    )}
                </View>

            </View>
        </SafeAreaView>
    );
}
