import {
    View,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Keyboard,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUpsertServiceProvider } from '../../hooks/useUpsertServiceProvider';
import { CreateServiceFormFields } from '../createService/CreateServiceFormFields'
import { Ionicons } from '@expo/vector-icons';
import FlatListPickerModal from '../FlatListPickerModal';
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS,
    SERVICE_CATEGORIES,
} from '../../constants/createServices';
import { PricingBasis, AvailabilityStatus } from '../../types';

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
    removePortfolioImage,
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
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Form state structure matching your clean schema types model
    const [formData, setFormData] = useState({
        businessName: '',
        category: '',
        serviceType: '',
        description: '',
        pricing: {
            rate: 0,
            basis: 'per hour' as PricingBasis,
            currency: 'GHS',
        },
        phoneNumber: '',
        whatsappNumber: '',
        region: '',
        district: '',
        location: '',
        availabilityStatus: 'Available' as AvailabilityStatus,
    });

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (editingService) {
            setFormData({
                businessName: editingService.businessName || '',
                category: editingService.category || '',
                serviceType: editingService.serviceType || '',
                description: editingService.description || '',
                pricing: {
                    rate: editingService.pricing?.rate ? Number(editingService.pricing.rate) : 0,
                    basis: (editingService.pricing?.basis || 'per hour') as PricingBasis,
                    currency: editingService.pricing?.currency || 'GHS',
                },
                phoneNumber: editingService.phoneNumber || '',
                whatsappNumber: editingService.whatsappNumber || '',
                region: editingService.region || '',
                district: editingService.district || '',
                location: editingService.location || '',
                availabilityStatus: (editingService.availabilityStatus || 'Available') as AvailabilityStatus,
            });

            setPortfolioImages(
                editingService.portfolioImages
                    ? editingService.portfolioImages.map((url: string, i: number) => ({
                          uri: url,
                          isRemote: true,
                          type: 'image/jpeg',
                          name: `portfolio_${i}.jpg`,
                      }))
                    : []
            );
        } else {
            resetForm();
        }
    }, [editingService]);

    const resetForm = () => {
        setFormData({
            businessName: '',
            category: '',
            serviceType: '',
            description: '',
            pricing: {
                rate: 0,
                basis: 'per hour',
                currency: 'GHS',
            },
            phoneNumber: '',
            whatsappNumber: '',
            region: '',
            district: '',
            location: '',
            availabilityStatus: 'Available',
        });
        setPortfolioImages([]);
        setValidationErrors([]);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingService(null);
        resetForm();

        const canGoBack =
            Platform.OS === 'web'
                ? typeof window !== 'undefined' && window.history.length > 1 && router.canGoBack()
                : router.canGoBack();

        if (canGoBack) {
            router.back();
        } else {
            router.replace('/my-activity' as any);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            if (field === 'region') {
                updated.district = '';
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        const activeErrors: string[] = [];

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

        setValidationErrors(activeErrors);

        if (activeErrors.length > 0) {
            Alert.alert('Missing Information', 'Please correct the highlighted fields before submitting.');
            return;
        }

        const localPicks = portfolioImages.filter((img) => !img.isRemote);

        try {
            await mutateAsync({
                serviceId: editingService?._id || undefined,
                businessName: formData.businessName,
                category: formData.category || 'Services',
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
                portfolioImageFiles:
                    localPicks.length > 0
                        ? localPicks.map((img) => ({
                              uri: img.uri,
                              name: img.name || 'upload.jpg',
                              type: img.type || 'image/jpeg',
                          }))
                        : null,
            } as any);

            Alert.alert('Success 🎉', 'Service provider profile saved successfully.');
            setShowModal(false);
            setEditingService(null);
            resetForm();
            setValidationErrors([]);
            router.replace('/my-activity' as any);
        } catch (error: any) {
            console.error('Failed to submit profile listing:', error);
            Alert.alert('Submission Error', error.message || 'Could not complete your request at this time.');
        }
    };

    const availableDistricts = formData.region
        ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
        : [];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-white overflow-hidden"
            style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
        >
            {/* Full-width ScrollView so desktop scrollbar sits flush on the right edge */}
            <ScrollView
                className="flex-1 px-5 py-4 bg-white"
                showsVerticalScrollIndicator={Platform.OS === 'web'}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{
                    paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 120,
                }}
            >
                <View className="w-full max-w-2xl self-center flex-1 pt-2">
                    {/* Inline Action Bar Header */}
                    <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-gray-100">
                        <View className="flex-1 pr-3">
                            <Text className="text-gray-900 font-extrabold text-xl">
                                {isEditing ? 'Modify Service' : 'Service Specifications'}
                            </Text>
                            <Text className="text-gray-400 text-xs mt-0.5 font-medium">
                                Please provide exact business & pricing details
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleCloseModal}
                            activeOpacity={0.7}
                            className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center"
                        >
                            <Ionicons name="close-outline" size={16} color="#4B5563" />
                            <Text className="text-gray-600 font-semibold text-xs ml-0.5">Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <CreateServiceFormFields
                        formData={formData}
                        handleInputChange={handleInputChange}
                        images={portfolioImages}
                        pickImages={pickImages}
                        takePhoto={takePhoto}
                        removeImage={removePortfolioImage}
                        openCategoryPicker={() => setShowCategoryModal(true)}
                        openBasisPicker={() => setShowBasisModal(true)}
                        openWorkModePicker={() => setShowAvailabilityModal(true)}
                        openRegionPicker={() => setShowRegionModal(true)}
                        openDistrictPicker={() => {
                            if (!formData.region) {
                                Alert.alert(
                                    'Select Region First',
                                    'Please choose your region before selecting a district.'
                                );
                                return;
                            }
                            setShowDistrictModal(true);
                        }}
                        errors={validationErrors}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isPending}
                        activeOpacity={0.85}
                        className={`w-full py-4 rounded-xl items-center mt-4 ${
                            isPending ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                    >
                        {isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="text-white font-bold text-base">
                                {isEditing ? 'Update Service Profile' : 'Publish Service Profile'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Selection Modals (Centered on Desktop with Scrollbars) */}
            <FlatListPickerModal
                visible={showCategoryModal}
                title="Select Service Specialty / Category"
                data={SERVICE_CATEGORIES}
                selectedValue={formData.serviceType}
                onSelect={(val) => {
                    handleInputChange('serviceType', val);
                    handleInputChange('category', val);
                }}
                onClose={() => setShowCategoryModal(false)}
            />

            <FlatListPickerModal
                visible={showBasisModal}
                title="Select Pricing Basis"
                data={['per hour', 'per day', 'fixed', 'starting at', 'contact for quote']}
                selectedValue={formData.pricing.basis}
                onSelect={(val) =>
                    setFormData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, basis: val as PricingBasis },
                    }))
                }
                onClose={() => setShowBasisModal(false)}
            />

            <FlatListPickerModal
                visible={showAvailabilityModal}
                title="Select Availability Status"
                data={['Available', 'Busy', 'Unavailable']}
                selectedValue={formData.availabilityStatus}
                onSelect={(val) => handleInputChange('availabilityStatus', val)}
                onClose={() => setShowAvailabilityModal(false)}
            />

            <FlatListPickerModal
                visible={showRegionModal}
                title="Select Region"
                data={GHANA_REGIONS}
                selectedValue={formData.region}
                onSelect={(val) => handleInputChange('region', val)}
                onClose={() => setShowRegionModal(false)}
            />

            <FlatListPickerModal
                visible={showDistrictModal}
                title="Select District"
                data={availableDistricts}
                selectedValue={formData.district}
                onSelect={(val) => handleInputChange('district', val)}
                onClose={() => setShowDistrictModal(false)}
            />
        </KeyboardAvoidingView>
    );
};

export default CreateServiceForm;