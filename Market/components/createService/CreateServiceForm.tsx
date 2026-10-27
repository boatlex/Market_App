import { View, Modal, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useUpsertServiceProvider } from '../../hooks/useUpsertServiceProvider'
import {CreateServiceFormFields} from '../createService/CreateServiceFormFields'
import { Ionicons } from '@expo/vector-icons'

import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS, 
    JOB_CATEGORIES
} from '../../constants/createJobs'
import SafeScreen from '../SafeScreen'
import { ServiceProvider, PricingBasis, AvailabilityStatus } from '../../types'

export interface SelectedFileMeta {
    uri: string;
    type: string;
    name: string;
    isRemote: boolean;
}

interface CreateServiceFormProps {
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
}: CreateServiceFormProps) => {
    const isEditing = !!editingService;
    const router = useRouter();

    const { mutateAsync, isPending } = useUpsertServiceProvider();

    // Modal open/close visibility states
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [showBasisModal, setShowBasisModal] = useState(false); 
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    // Form state structure matching your clean schema types model
    const [formData, setFormData] = useState({
        businessName: "",
        category: "",
        serviceType: "", 
        description: "",
        pricing: {
            rate: 0,
            basis: 'per hour' as PricingBasis,
            currency: 'GHS'
        },
        phoneNumber: "",
        whatsappNumber: "",
        region: "",
        district: "",
        location: "",
        availabilityStatus: 'Available' as AvailabilityStatus
    });

    useEffect(() => {
        if (editingService) {
            setFormData({
                businessName: editingService.businessName || "",
                category: editingService.category || "",
                serviceType: editingService.serviceType || "",
                description: editingService.description || "",
                pricing: {
                    rate: editingService.pricing?.rate ? Number(editingService.pricing.rate) : 0,
                    basis: (editingService.pricing?.basis || "per hour") as PricingBasis,
                    currency: editingService.pricing?.currency || "GHS"
                },
                phoneNumber: editingService.phoneNumber || "",
                whatsappNumber: editingService.whatsappNumber || "",
                region: editingService.region || "",
                district: editingService.district || "",
                location: editingService.location || "",
                availabilityStatus: (editingService.availabilityStatus || "Available") as AvailabilityStatus
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
            category: "",
            serviceType: "",
            description: "",
            pricing: {
                rate: 0,
                basis: 'per hour',
                currency: 'GHS'
            },
            phoneNumber: "",
            whatsappNumber: "",
            region: "",
            district: "",
            location: "",
            availabilityStatus: 'Available'
        });
        setPortfolioImages([]);
        setValidationErrors([]);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingService(null);
        resetForm();
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/my-activity' as any); 
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "region") {
                updated.district = ""; 
            }
            return updated;
        });
    };



const handleSubmit = async () => {

    const activeErrors: string[] = [];
    
    // Check individual model properties sequentially
    if (!formData.businessName) activeErrors.push('businessName');
    if (!formData.serviceType) activeErrors.push('serviceType');
    if (!formData.description) activeErrors.push('description');
    if (!formData.region) activeErrors.push('region');
    if (!formData.district) activeErrors.push('district');
    if (!formData.location) activeErrors.push('location');
    if (!formData.phoneNumber) activeErrors.push('phoneNumber');
    
    if (formData.pricing.basis !== 'contact for quote' && !formData.pricing.rate) {
        activeErrors.push('rate');
    }

    // Save identified errors down to state to trigger red layouts
    setValidationErrors(activeErrors);

    if (activeErrors.length > 0) {
        Alert.alert("Missing Information", "Please correct the highlighted fields before submitting.");
        return;
    }

    const localPicks = portfolioImages.filter(img => !img.isRemote);

    try {
        await mutateAsync({
            serviceId: editingService?._id || undefined,
            businessName: formData.businessName,
            category: formData.category || "Services", 
            serviceType: formData.serviceType,
            description: formData.description,
            rate: Number(formData.pricing.rate) || 0,
            basis: formData.pricing.basis as any,
            currency: formData.pricing.currency,
            phoneNumber: formData.phoneNumber,
            whatsappNumber: formData.whatsappNumber || undefined,
            region: formData.region,
            district: formData.district,
            location: formData.location,
            availabilityStatus: formData.availabilityStatus,
            portfolioImageFiles: localPicks.length > 0 ? localPicks.map(img => ({
                uri: img.uri,
                name: img.name || 'upload.jpg',
                type: img.type || 'image/jpeg'
            })) : null
        } as any);

        Alert.alert("Success 🎉", "Service provider profile saved successfully.");
        setShowModal(false);
        setEditingService(null);
        resetForm();
        setValidationErrors([]); // Clear errors array
        router.replace('/my-activity' as any);

    } catch (error: any) {
        console.error("Failed to submit profile listing:", error);
        Alert.alert("Submission Error", error.message || "Could not complete your request at this time.");
    }
};





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
                        <Text className="text-gray-950 font-black text-base">{title}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
                            <Ionicons name="close" size={20} color="#1F2937" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                onPress={() => { onSelect(item); onClose(); }}
                                className="px-6 py-4 border-b border-gray-50 active:bg-gray-50"
                            >
                                <Text className="text-gray-700 font-semibold text-sm">{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <Modal visible={showModal} animationType="fade" onRequestClose={handleCloseModal}>
            <SafeScreen>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
                    
                    <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
                        <TouchableOpacity onPress={handleCloseModal} className="p-1">
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text className="text-gray-950 font-black text-base">
                            {isEditing ? 'Modify Service Profile' : 'Create Trade Listing'}
                        </Text>
                        <View className="w-6" /> 
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        <CreateServiceFormFields
                            formData={formData}
                            handleInputChange={handleInputChange}
                            errors={validationErrors}
                            images={portfolioImages}
                            pickImages={pickImages}
                            takePhoto={takePhoto}
                            removeImage={removePortfolioImage}
                            openRegionPicker={() => setShowRegionModal(true)}
                            openDistrictPicker={() => {
                                if (!formData.region) {
                                    Alert.alert("Region Required", "Please select a region before choosing a district.");
                                    return;
                                }
                                setShowDistrictModal(true);
                            }}
                            openCategoryPicker={() => setShowCategoryModal(true)}
                            openWorkModePicker={() => setShowAvailabilityModal(true)}
                            openBasisPicker={() => setShowBasisModal(true)} // 🔑 Triggers separate basis modal context switcher channel
                        />

                        {/* Submit Action Pipeline Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isPending}
                            className={`w-full py-4 rounded-2xl items-center justify-center mt-6 ${
                                isPending ? 'bg-gray-400' : 'bg-gray-950'
                            }`}
                        >
                            {isPending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-black text-sm">
                                    {isEditing ? 'Save Modifications' : 'Publish Business Profile'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                </KeyboardAvoidingView>
            </SafeScreen>

            {/* ========================================================================= */}
            {/* 🔑 FIXED MODEL-ALIGNED CUSTOM PICKER SHEETS CONTAINER LAYOUT ROW */}
            {/* ========================================================================= */}

            {/* 1. Region Selector Sheet */}
            <FlatListPickerModal
                visible={showRegionModal}
                title="Select Region"
                data={GHANA_REGIONS}
                onSelect={(item) => handleInputChange("region", item)}
                onClose={() => setShowRegionModal(false)}
            />

            {/* 2. District Selector Sheet */}
            <FlatListPickerModal
                visible={showDistrictModal}
                title="Select District"
                data={formData.region ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || [] : []}
                onSelect={(item) => handleInputChange("district", item)}
                onClose={() => setShowDistrictModal(false)}
            />

            {/* 3. Specialty Trade/Category Picker Sheet */}
            <FlatListPickerModal
                visible={showCategoryModal}
                title="Select Service Category"
                data={JOB_CATEGORIES}
                onSelect={(item) => {
                    handleInputChange("serviceType", item);
                    handleInputChange("category", "Services"); // Automatically flags core structural category fallback context
                }}
                onClose={() => setShowCategoryModal(false)}
            />

            {/* 4. Availability Enums Tracker Sheet */}
            <FlatListPickerModal
                visible={showAvailabilityModal}
                title="Select Availability"
                data={['Available', 'Busy', 'Away']}
                onSelect={(item) => handleInputChange("availabilityStatus", item as AvailabilityStatus)}
                onClose={() => setShowAvailabilityModal(false)}
            />

            {/* 5. 🔑 FIXED: Isolated Pricing Basis Picker Sheet */}
            <FlatListPickerModal
                visible={showBasisModal}
                title="Select Pricing Basis"
                data={['per hour', 'per day', 'fixed project', 'contact for quote']}
                onSelect={(item) => handleInputChange("pricing", { ...formData.pricing, basis: item as PricingBasis })}
                onClose={() => setShowBasisModal(false)}
            />

        </Modal>
    );
};

export default CreateServiceForm;

