import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SafeScreen from '../../../components/SafeScreen';
import { useGetJobApplications, RecruiterApplicationItem } from '../../../hooks/useGetJobApplications';
import { useUpdateApplicationStatus } from '../../../hooks/useUpdateApplicationStatus';

type FilterSegmentType = 'all' | 'pending' | 'shortlisted' | 'rejected';

const RecruiterApplicationsScreen = () => {
    const router = useRouter();
    const { jobId, jobTitle } = useLocalSearchParams<{ jobId: string; jobTitle: string }>();

    const [activeSegment, setActiveSegment] = useState<FilterSegmentType>('all');

    const { data, isLoading, isError, refetch } = useGetJobApplications(jobId || "");
    const statusMutation = useUpdateApplicationStatus(jobId || "");

    const applications = data?.applications || [];

    // Filter pipeline collections based on active top-bar filter segments
    const filteredApplications = applications.filter(app => {
        if (activeSegment === 'all') return true;
        if (activeSegment === 'shortlisted') return app.status === 'shortlisted' || app.status === 'accepted';
        return app.status === activeSegment;
    });

    const handleReviewAction = (item: RecruiterApplicationItem) => {
        Alert.alert(
            "Application Decision",
            `Update hiring pipelines status for ${item.applicant?.name || 'Candidate'}:`,
            [
                {
                    text: "Mark Shortlisted",
                    onPress: () => executeStatusUpdate(item._id, 'shortlisted', "Matches criteria perfectly. Let's schedule an interview.")
                },
                {
                    text: "Mark as Reviewed",
                    onPress: () => executeStatusUpdate(item._id, 'reviewed', "Profile inspected. Pending follow-up.")
                },
                {
                    text: "Decline Candidate",
                    style: "destructive",
                    onPress: () => executeStatusUpdate(item._id, 'rejected', "Thank you for your interest, we are proceeding with other applicants.")
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const executeStatusUpdate = (applicationId: string, status: any, notes: string) => {
        statusMutation.mutate({ applicationId, status, notesByEmployer: notes }, {
            onSuccess: (res: any) => {
                Alert.alert("Pipeline Synchronized", res?.message || "Hiring status updated successfully.");
            },
            onError: (err: any) => {
                Alert.alert("Action Rejected", err?.response?.data?.message || "Failed to alter status variables.");
            }
        });
    };

    const renderApplicantCard = ({ item }: { item: RecruiterApplicationItem }) => {
        const candidate = item.applicant || { name: "Anonymous Applicant", email: "No Email Provided", phoneNumber: "" };

        return (
            <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">

                {/* Header Profile Info Wrapper */}
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-2">
                        <Text className="text-gray-950 font-black text-base">{candidate.name}</Text>
                        <Text className="text-gray-400 font-medium text-xs mt-0.5">{candidate.email}</Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-md border ${item.status === 'shortlisted' || item.status === 'accepted'
                            ? 'bg-emerald-50 border-emerald-100'
                            : item.status === 'rejected'
                                ? 'bg-rose-50 border-rose-100'
                                : 'bg-amber-50 border-amber-100'
                        }`}>
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${item.status === 'shortlisted' || item.status === 'accepted' ? 'text-emerald-700' : item.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                            }`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {/* Candidate Cover Letter Row Container */}
                {item.coverLetter ? (
                    <View className="mb-4 p-3 bg-gray-50/70 border border-gray-100 rounded-xl">
                        <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-wider mb-1">Cover Letter Summary</Text>
                        <Text className="text-gray-700 text-xs leading-relaxed">"{item.coverLetter}"</Text>
                    </View>
                ) : (
                    <Text className="text-gray-400 text-xs italic mb-4">No cover letter pitch attached by applicant.</Text>
                )}

                {/* Core Action Callouts Footnotes */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-50 gap-2">

                    {/* CV Display Web Trigger Shortcut Button */}
                    <TouchableOpacity
                        onPress={() => item.resume && Linking.openURL(item.resume)}
                        className="bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl flex-row items-center justify-center flex-1"
                    >
                        <Ionicons name="document-attach-outline" size={14} color="#2563eb" className="mr-1" />
                        <Text className="text-blue-600 font-bold text-xs uppercase tracking-wide">Review CV</Text>
                    </TouchableOpacity>

                    {/* Quick Dial Phone Line Shortcut */}
                    {candidate.phoneNumber ? (
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${candidate.phoneNumber}`)}
                            className="bg-gray-50 border border-gray-200 w-10 h-9 rounded-xl items-center justify-center"
                        >
                            <Ionicons name="call-outline" size={15} color="#4B5563" />
                        </TouchableOpacity>
                    ) : null}

                    {/* Manage Pipeline State Status Picker */}
                    <TouchableOpacity
                        onPress={() => handleReviewAction(item)}
                        className="bg-gray-950 px-3 py-2 rounded-xl flex-row items-center justify-center flex-1"
                    >
                        <Ionicons name="create-outline" size={14} color="white" className="mr-1" />
                        <Text className="text-white font-bold text-xs uppercase tracking-wide">Manage Status</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeScreen>
            <View className="flex-1 bg-gray-50/50">

                {/* Header Back Strip */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-100 bg-white shadow-sm">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-1 mr-4 bg-gray-50 border border-gray-100 rounded-full active:bg-gray-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-black text-lg" numberOfLines={1}>Applicant Manager</Text>
                        <Text className="text-gray-400 text-xs font-medium" numberOfLines={1}>{jobTitle || "Vacancy Pipeline"}</Text>
                    </View>
                </View>

                {/* Sub-tab segmented filter view switches */}
                <View className="flex-row bg-white border-b border-gray-100 px-4 py-2 gap-1.5">
                    {                    (['all', 'pending', 'shortlisted', 'rejected'] as FilterSegmentType[]).map((segment) => (
                        <TouchableOpacity
                            key={segment}
                            onPress={() => setActiveSegment(segment)}
                            className={`px-2.5 py-2 rounded-xl border flex-1 items-center justify-center ${
                                activeSegment === segment ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200/80'
                            }`}
                        >
                            <Text className={`text-[11px] font-extrabold capitalize ${activeSegment === segment ? 'text-white' : 'text-gray-500'}`}>
                                {segment}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Content Area Handling State Renderers */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#2563eb" size="large" />
                        <Text className="text-gray-400 text-xs font-semibold mt-2">Loading pipeline profiles...</Text>
                    </View>
                ) : isError ? (
                    <View className="flex-1 items-center justify-center px-6">
                        <Ionicons name="warning-outline" size={48} color="#dc2626" />
                        <Text className="text-gray-700 font-bold text-base mt-3">Failed to load profiles</Text>
                        <TouchableOpacity onPress={() => refetch()} className="mt-3 px-4 py-2 bg-blue-600 rounded-lg">
                            <Text className="text-white font-semibold">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredApplications}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => renderApplicantCard({ item })}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshing={isLoading}
                        onRefresh={refetch}
                        ListEmptyComponent={
                            <View className="items-center justify-center pt-32 px-6">
                                <Ionicons name="people-outline" size={54} color="#9CA3AF" />
                                <Text className="text-gray-800 font-bold text-lg mt-4 text-center">No candidates found</Text>
                                <Text className="text-gray-400 text-sm mt-1 text-center">
                                    {activeSegment === 'all' 
                                        ? "Applicants who submit a resume for this vacancy will show up here." 
                                        : `No candidate profiles match the status filters "${activeSegment}".`}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeScreen>
    );
};

export default RecruiterApplicationsScreen;
