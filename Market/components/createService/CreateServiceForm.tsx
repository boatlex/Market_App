import { View, Modal, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useUpsertServiceProvider } from '../../hooks/useUpsertServiceProvider'
import { CreateServiceFormFields } from '../createService/CreateServiceFormFields'
import { Ionicons } from '@expo/vector-icons'

import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS, 
    JOB_CATEGORIES,
    WORK_MODE, 
    JOB_TYPES
} from '../../constants/createJobs'
import SafeScreen from '../SafeScreen'

type WorkModeType = typeof WORK_MODE[number];

export interface SelectedFileMeta {
    uri: string;
    type: string;
    name: string;
    isRemote: boolean;
}

interface CreateJobFormProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingService: any | null;
    setEditingService: (service: any | null) => void;
    portfolioImages: SelectedFileMeta[]; 
    setPortfolioImages: React.Dispatch<React.SetStateAction<SelectedFileMeta[]>>; 
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removePortfolioImage: (indexToRemove: number) => void; 
}

const CreateServiceForm = ({
    showModal,
    setShowModal,
    editingService,
    setEditingService,
    portfolioImages,      
    setPortfolioImages,   
    pickImages,
    takePhoto,
    removePortfolioImage
}: CreateJobFormProps) => {
    const isEditing = !!editingService;
    const router = useRouter();

    // ✅ FIXED: Destructured the correct native mutation triggers from useUpsertServiceProvider
    const { mutateAsync, isPending } = useUpsertServiceProvider();

    // Modal open/close visibility states
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);
    const [showJobTypeModal, setShowJobTypeModal] = useState(false);

    // Form inputs state tracker
    const [formData, setFormData] = useState({
        businessName: "",
        serviceType: "",
        description: "",
        category: "",
        jobType: "", 
        workMode: "On-site" as WorkModeType,
        currency: "GHS",
        salaryMin: "",
        salaryMax: "",
        salaryPeriod: "monthly",
        phoneNumber: "",
        emailForApplications: "",
        region: "",
        district: "",
        location: "",
        requirements: "", 
        benefits: "",     
        applicationDeadline: ""
    });

    useEffect(() => {
        if (editingService) {
            setFormData({
                businessName: editingService.businessName || "",
                serviceType: editingService.serviceType || "",
                description: editingService.description || "",
                category: editingService.category || "",
                jobType: editingService.jobType || "",
                workMode: editingService.workMode || "On-site",
                currency: editingService.pricing?.currency || "GHS",
                salaryMin: editingService.pricing?.rate ? String(editingService.pricing.rate) : "",
                salaryMax: "",
                salaryPeriod: editingService.pricing?.basis || "per hour",
                phoneNumber: editingService.phoneNumber || "",
                emailForApplications: "",
                region: editingService.region || "",
                district: editingService.district || "",
                location: editingService.location || "",
                requirements: "",
                benefits: "",
                applicationDeadline: ""
            });
            
            setPortfolioImages(editingService.portfolioImages ? editingService.portfolioImages.map((url: string, i: number) => ({
                uri: url, isRemote: true, type: 'image/jpeg', name: `portfolio_${i}.jpg`
            })) : []);
        } else {
            resetForm();
        }
    }, [editingService]);

    const resetForm = () => {
        setFormData({
            businessName: "",
            serviceType: "",
            description: "",
            category: "",
            jobType: "",
            workMode: "On-site",
            currency: "GHS",
            salaryMin: "",
            salaryMax: "",
            salaryPeriod: "monthly",
            phoneNumber: "",
            emailForApplications: "",
            region: "",
            district: "",
            location: "",
            requirements: "",
            benefits: "",
            applicationDeadline: ""
        });
        setPortfolioImages([]);
        setShowDistrictModal(false);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingService(null);
        resetForm();

        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/my-jobs' as any); 
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "region") {
                updated.district = ""; 
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        // Enforce required fields validation check before uploading assets
        if (
            !formData.businessName || 
            !formData.serviceType || 
            !formData.description || 
            !formData.category || 
            !formData.region || 
            !formData.district || 
            !formData.location ||
            !formData.phoneNumber
        ) {
            Alert.alert("Missing Information", "Please fill out all mandatory fields tagged with an asterisk.");
            return;
        }

        const localPicks = portfolioImages.filter(img => !img.isRemote);

        try {
            // ✅ FIXED: Remapped final fields payload to match UpsertServiceProviderVariables expectations
            await mutateAsync({
                businessName: formData.businessName,
                category: formData.category,
                serviceType: formData.serviceType,
                description: formData.description,
                rate: Number(formData.salaryMin) || 0,
                basis: formData.salaryPeriod as any,
                currency: formData.currency,
                phoneNumber: formData.phoneNumber,
                region: formData.region,
                district: formData.district,
                location: formData.location,
                availabilityStatus: "Available",
                portfolioImageFiles: localPicks.length > 0 ? localPicks.map(img => ({
                    uri: img.uri,
                    name: img.name || 'upload.jpg',
                    type: img.type || 'image/jpeg'
                })) : null
            });

            Alert.alert("Success 🎉", "Service provider profile saved and synchronized successfully.");
            setShowModal(false);
            setEditingService(null);
            resetForm();
            router.replace('/my-jobs' as any);

        } catch (error: any) {
            console.error("Failed to submit profile listing:", error);
            Alert.alert("Submission Error", error.message || "Could not complete your request at this time.");
        }
    };

    // Reusable FlatList Picker Modal Component
    const FlatListPickerModal = ({ 
        visible, 
        title, 
        data, 
        onSelect, 
        onClose 
    }: { 
        visible: boolean; 
        title: string;
        data: readonly string[] | string[];
        onSelect: (item: string) => void;
        onClose: () => void;
    }) => (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl max-h-[80%] pb-6">
                    <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                        <Text className="text-gray-900 font-black text-base">{title}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
                            <Ionicons name="close" size={18} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data as string[]}
                        keyExtractor={(item) => item}
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
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <Modal visible={showModal} animationType="fade" onRequestClose={handleCloseModal}>
            <SafeScreen>
                               {/* Header Action Banner */}
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <Text className="text-xl font-black text-gray-900">
                        {isEditing ? "Modify Business Profile" : "Register Trade Service"}
                    </Text>
                    <TouchableOpacity onPress={handleCloseModal} className="p-2 bg-gray-50 border border-gray-100 rounded-full">
                        <Ionicons name="close" size={20} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                {/* Form Body Wrap */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        
                        <CreateServiceFormFields
                            formData={formData}
                            handleInputChange={handleInputChange}
                            images={portfolioImages} 
                            pickImages={pickImages}
                            takePhoto={takePhoto}
                            removeImage={removePortfolioImage} 
                            openRegionPicker={() => setShowRegionModal(true)}
                            openDistrictPicker={() => setShowDistrictModal(true)}
                            openCategoryPicker={() => setShowCategoryModal(true)}
                            openWorkModePicker={() => setShowWorkModeModal(true)}
                            openJobTypePicker={() => setShowJobTypeModal(true)}
                            openDatePicker={() => {}} 
                        />

                        {/* Submit Operations Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isPending}
                            className={`w-full py-4 rounded-xl mt-6 flex-row items-center justify-center ${
                                isPending ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700 shadow-sm'
                            }`}
                        >
                            {isPending ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                                    <Text className="text-white font-extrabold text-base">Uploading to Cloudinary...</Text>
                                </>
                            ) : (
                                <Text className="text-white font-extrabold text-base">
                                    {isEditing ? "Update Business Profile" : "Publish Service Listing"}
                                </Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Dropdown Selection Picker Overlays */}
                <FlatListPickerModal visible={showRegionModal} title="Select Region" data={GHANA_REGIONS} onSelect={(val) => handleInputChange("region", val)} onClose={() => setShowRegionModal(false)} />
                <FlatListPickerModal visible={showDistrictModal} title="Select District" data={formData.region ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || [] : []} onSelect={(val) => handleInputChange("district", val)} onClose={() => setShowDistrictModal(false)} />
                <FlatListPickerModal visible={showCategoryModal} title="Select Trade Category" data={JOB_CATEGORIES} onSelect={(val) => handleInputChange("category", val)} onClose={() => setShowCategoryModal(false)} />
                <FlatListPickerModal visible={showWorkModeModal} title="Select Arrangement Mode" data={WORK_MODE} onSelect={(val) => handleInputChange("workMode", val)} onClose={() => setShowWorkModeModal(false)} />
                <FlatListPickerModal visible={showJobTypeModal} title="Select Service Type" data={JOB_TYPES} onSelect={(val) => handleInputChange("jobType", val)} onClose={() => setShowJobTypeModal(false)} />
            </SafeScreen>
        </Modal>
    );
};

export default CreateServiceForm;
