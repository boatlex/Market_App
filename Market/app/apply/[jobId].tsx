import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { useApplyToJob } from '../../hooks/useApplyToJob';

const ApplyJobScreen = () => {
    const router = useRouter();
    const { jobId, jobTitle, companyName } = useLocalSearchParams<{ 
        jobId: string; 
        jobTitle: string; 
        companyName: string; 
    }>();

    const applyMutation = useApplyToJob();
    const [coverLetter, setCoverLetter] = useState("");

    const handleFormSubmit = () => {
        if (!jobId) return;

        applyMutation.mutate({ jobId, coverLetter }, {
            onSuccess: (data) => {
                Alert.alert("Success 🎉", data.message || "Your application was sent successfully!", [
                    { 
                        text: "Done", 
                        onPress: () => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)');
                            }
                        } 
                    }
                ]);
            },
            onError: (error: any) => {
                // Catch message arrays from your controller
                const serverErrorMessage = error?.response?.data?.message || "An unexpected error occurred during submission.";
                Alert.alert("Application Blocked", serverErrorMessage);
            }
        });
    };

    return (
        <SafeScreen>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1 bg-white"
            >
                {/* Minimalist Top App Navigation Strip Header */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-100 bg-white shadow-sm">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="p-1 mr-4 bg-gray-50 border border-gray-100 rounded-full"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-extrabold text-lg" numberOfLines={1}>Job Application</Text>
                    </View>
                </View>

                <ScrollView 
                    className="flex-1 px-6 pt-5" 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Position Summary Heading Card Context */}
                    <View className="mb-6 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
                        <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">Target Vacancy Pipeline</Text>
                        <Text className="text-gray-950 font-black text-xl mb-1 leading-tight">{jobTitle}</Text>
                        <Text className="text-blue-600 font-bold text-sm">{companyName}</Text>
                    </View>

                    {/* Informative Automated Data Policy Banner Check */}
                    <View className="mb-6 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex-row items-start gap-3">
                        <Ionicons name="document-text" size={22} color="#4B5563" className="mt-0.5" />
                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold text-sm">Automatic Resume Attachment</Text>
                            <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                                Our platform automatically appends your verified hosted cloud CV file from your candidate profile dashboard settings. No local file uploads needed.
                            </Text>
                        </View>
                    </View>

                    {/* Optional Cover Letter Large Multi-line input */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-bold mb-1.5">
                            Cover Letter / Pitch <Text className="text-gray-400 text-xs font-medium">(Optional)</Text>
                        </Text>
                        <TextInput
                            className="w-full min-h-[160px] border border-gray-200 rounded-2xl p-4 bg-gray-50/50 text-gray-800 text-base"
                            placeholder="Introduce yourself, write a short pitch, or outline why you're a great fit for this role to catch the employer's attention..."
                            multiline
                            textAlignVertical="top"
                            value={coverLetter}
                            onChangeText={setCoverLetter}
                        />
                    </View>

                    {/* Operational Submit Action Publishing Trigger */}
                    <TouchableOpacity
                        disabled={applyMutation.isPending}
                        onPress={handleFormSubmit}
                        activeOpacity={0.8}
                        className={`w-full py-4 rounded-xl items-center flex-row justify-center mt-4 mb-16 ${
                            applyMutation.isPending ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                    >
                        {applyMutation.isPending && (
                            <ActivityIndicator size="small" color="#FFF" className="mr-2" />
                        )}
                        <Text className="text-white font-extrabold text-base">
                            {applyMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
};

export default ApplyJobScreen;
