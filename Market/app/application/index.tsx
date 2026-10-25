import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useGetMyApplications, ApplicationItem } from '../../hooks/useGetMyApplications';

type TabStatusType = 'all' | 'Pending' | 'Shortlisted' | 'Rejected';

const MyApplicationsScreen = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabStatusType>('all');
    const { data, isLoading, isError, refetch } = useGetMyApplications();

    const allApplications = data?.applications || [];

    // Filter application arrays conditionally based on selected sub-tab index segment
    const filteredApplications = allApplications.filter(app => {
        if (activeTab === 'all') return true;
        if (activeTab === 'Shortlisted') return app.status === 'Shortlisted' || app.status === 'Accepted';
        return app.status === activeTab;
    });

    // Helper mapping utility for atomic status text pill badges colors
    const getStatusStyle = (status: ApplicationItem['status']) => {
        switch (status) {
            case 'Accepted':
            case 'Shortlisted':
                return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Shortlisted' };
            case 'Rejected':
                return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', label: 'Declined' };
            case 'Reviewed':
                return { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', label: 'Reviewed' };
            default:
                return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Pending' };
        }
    };

    const renderApplicationCard = ({ item }: { item: ApplicationItem }) => {
        const jobMeta = item.job || { title: "Unknown Position", companyName: "Unknown Company", district: "", region: "", isOpen: false };
        const statusMeta = getStatusStyle(item.status);
        
        // Parse date values cleanly matching standard GH formatting structures
        const formattedDate = new Date(item.createdAt).toLocaleDateString('en-GH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return (
            <TouchableOpacity
                onPress={() => router.push(`/my-job/${jobMeta._id}` as any)}
                activeOpacity={0.85}
                className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm"
            >
                {/* Top Row: Job Title and Status Badge */}
                <View className="flex-row justify-between items-start mb-1.5 gap-2">
                    <Text className="text-gray-950 font-black text-base flex-1 leading-snug" numberOfLines={1}>
                        {jobMeta.title}
                    </Text>
                    <View className={`px-2.5 py-0.5 rounded-md border ${statusMeta.bg}`}>
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${statusMeta.text}`}>
                            {statusMeta.label}
                        </Text>
                    </View>
                </View>

                {/* Company Name */}
                <Text className="text-gray-500 font-semibold text-xs mb-3">
                    {jobMeta.companyName}
                </Text>

                {/* Bottom Row: Location Landmark and Applied Timeline Date */}
                <View className="flex-row justify-between items-center pt-2.5 border-t border-gray-50">
                    <View className="flex-row items-center flex-1 mr-2">
                        <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                        <Text className="text-[11px] text-gray-400 font-medium ml-0.5" numberOfLines={1}>
                            {jobMeta.district ? `${jobMeta.district}, ${jobMeta.region}` : "Remote"}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" className="mr-1" />
                        <Text className="text-[11px] text-gray-400 font-bold">{formattedDate}</Text>
                    </View>
                </View>

                {/* Employer Context Notes Section (Visible conditionally if notes exist) */}
                {item.notesByEmployer && (
                    <View className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl flex-row items-start">
                        <Ionicons name="chatbox-ellipses-outline" size={14} color="#4B5563" className="mt-0.5 mr-2" />
                        <Text className="text-xs text-gray-600 flex-1 italic leading-relaxed" numberOfLines={2}>
                            "{item.notesByEmployer}"
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeScreen>
            <View className="flex-1 bg-gray-50/50">
                {/* Header Action Strip */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-100 bg-white shadow-sm">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="p-1 mr-4 bg-gray-50 border border-gray-100 rounded-full active:bg-gray-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 font-black text-xl flex-1">My Applications</Text>
                </View>

                {/* Category Segmentation Filter Tabs Controller */}
                <View className="flex-row bg-white border-b border-gray-100 px-4 py-2 gap-1.5">
                    {(['all', 'Pending', 'Shortlisted', 'Rejected'] as TabStatusType[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`px-3.5 py-2 rounded-xl border flex-1 items-center justify-center ${
                                activeTab === tab 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'bg-white border-gray-200/80 active:bg-gray-50'
                            }`}
                        >
                            <Text className={`text-xs font-extrabold capitalize ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Data Feed Core Rendering Context Window */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#2563eb" size="large" />
                        <Text className="text-gray-400 text-xs font-semibold mt-2">Synchronizing application records...</Text>
                    </View>
                ) : isError ? (
                    <View className="flex-1 items-center justify-center px-6">
                        <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
                        <Text className="text-gray-700 font-bold text-base mt-4">Synchronization Fault</Text>
                        <TouchableOpacity onPress={() => refetch()} className="mt-3 px-5 py-2.5 bg-blue-600 rounded-xl">
                            <Text className="text-white font-semibold">Retry Stream</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredApplications}
                        keyExtractor={(item) => item._id}
                        renderItem={renderApplicationCard}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshing={isLoading}
                        onRefresh={refetch}
                        ListEmptyComponent={
                          <View className="items-center justify-center pt-28 px-6">
                            <Ionicons name="file-tray-stacked-outline" size={54} color="#9CA3AF" />
                            <Text className="text-gray-800 font-bold text-lg mt-4 text-center">No applications tracked</Text>
                            <Text className="text-gray-400 text-sm mt-1 text-center">
                              {activeTab === 'all' 
                                ? "Jobs you apply to inside the marketplace will display records here." 
                                : `You do not have any listings categorized under ${activeTab}.`}
                            </Text>
                          </View>
                        }
                    />
                )}
            </View>
        </SafeScreen>
    );
};

export default MyApplicationsScreen;
