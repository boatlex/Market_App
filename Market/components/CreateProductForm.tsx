import { View, Text, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useUpdateProduct } from '../hooks/useUpdateProduct'
import { useCreateProduct } from '../hooks/usecreateProduct'
import { ProductFormFields } from './ProductFormFields'
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS, PRODUCT_CATEGORIES,
    PRODUCT_CONDITIONS, SUB_CATEGORIES_BY_CATEGORY
} from '../constants/products'

interface CreateProductFormProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingProduct: any | null;
    setEditingProduct: (product: any | null) => void;
    images: any[];
    setImages: (images: any[]) => void;
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
}

const CreateProductForm = ({
    showModal,
    setShowModal,
    editingProduct,
    setEditingProduct,
    images,
    setImages,
    pickImages,
    takePhoto,
    removeImage
}: CreateProductFormProps) => {
    const isEditing = !!editingProduct;
    const router = useRouter();

    const { createProductAsync, isCreatingProduct } = useCreateProduct();
    const { updateProductAsync, isUpdatingProduct } = useUpdateProduct();

    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

    const [showDeliveryConfig, setShowDeliveryConfig] = useState(false);
    const [showWarrantyConfig, setShowWarrantyConfig] = useState(false);
    const [showDiscountConfig, setShowDiscountConfig] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        phoneNumber: "",
        category: "",
        productType: "",
        condition: "",
        region: "",
        district: "",
        location: "",
        warranty: "",
        brand: "",
        color: "",
        deliveryFrom: "",
        deliveryTo: ""
    });

    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name || "",
                description: editingProduct.description || "",
                price: String(editingProduct.price || ""),
                phoneNumber: editingProduct.phoneNumber || "",
                category: editingProduct.category || "",
                productType: editingProduct.productType || "",
                condition: editingProduct.condition || "",
                region: editingProduct.region || "",
                district: editingProduct.district || "",
                location: editingProduct.location || "",
                warranty: editingProduct.warranty || "",
                brand: editingProduct.brand || "",
                color: editingProduct.color || "",
                deliveryFrom: editingProduct.delivery?.from ? String(editingProduct.delivery.from) : "",
                deliveryTo: editingProduct.delivery?.to ? String(editingProduct.delivery.to) : "",
            });

            if (editingProduct.warranty) setShowWarrantyConfig(true);
            if (editingProduct.brand || editingProduct.color) setShowDiscountConfig(true);
            if (editingProduct.delivery) setShowDeliveryConfig(true);

            setImages(editingProduct.images ? editingProduct.images.map((img: string) => ({ uri: img, isRemote: true })) : []);
        } else {
            resetForm();
        }
    }, [editingProduct]);

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: "",
            phoneNumber: "",
            category: "",
            productType: "",
            condition: "",
            region: "",
            district: "",
            location: "",
            warranty: "",
            brand: "",
            color: "",
            deliveryFrom: "",
            deliveryTo: ""
        });
        setImages([]);
        setShowDeliveryConfig(false);
        setShowWarrantyConfig(false);
        setShowDiscountConfig(false);
        setShowDistrictModal(false);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        resetForm();

        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/my-adds' as any);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "region") {
                updated.district = "";
            }
            if (field === "category") {
                updated.productType = "";
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.region || !formData.condition || !formData.category || !formData.district || !formData.location || !formData.phoneNumber) {
            alert("Please fill in all the required fields including Phone Number and District/City.");
            return;
        }

        const finalPayload = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            phoneNumber: formData.phoneNumber,
            category: formData.category,
            productType: formData.productType,
            condition: formData.condition,
            region: formData.region,
            district: formData.district,
            location: formData.location,
            warranty: showWarrantyConfig && formData.warranty ? formData.warranty : undefined,
            brand: showDiscountConfig && formData.brand ? formData.brand : undefined,
            color: showDiscountConfig && formData.color ? formData.color : undefined,
            delivery: showDeliveryConfig && (formData.deliveryFrom || formData.deliveryTo) ? {
                from: formData.deliveryFrom ? new Date(Date.now() + parseInt(formData.deliveryFrom) * 24 * 60 * 60 * 1000).toISOString() : undefined,
                to: formData.deliveryTo ? new Date(Date.now() + parseInt(formData.deliveryTo) * 24 * 60 * 60 * 1000).toISOString() : undefined,
            } : undefined
        };

        try {
            if (isEditing) {
                const retainedRemoteImages = images.filter(img => img.isRemote).map(img => img.uri);
                const localPicksOnly = images.filter(img => !img.isRemote);

                if (retainedRemoteImages.length + localPicksOnly.length > 3) {
                    alert("Maximum 3 images allowed in total.");
                    return;
                }

                await updateProductAsync({
                    productId: editingProduct._id,
                    ...finalPayload,
                    images: localPicksOnly,
                    existingImages: retainedRemoteImages
                });
            } else {
                if (images.length === 0) {
                    alert("Please select at least 1 image.");
                    return;
                }
                if (images.length > 3) {
                    alert("Maximum 3 images allowed.");
                    return;
                }
                await createProductAsync({
                    ...finalPayload,
                    images: images
                });
            }

            setShowModal(false);
            setEditingProduct(null);
            resetForm();
            router.replace('/my-adds' as any);
        } catch (error) {
            console.error("Failed to submit product request:", error);
        }
    };

    const isSubmitting = isCreatingProduct || isUpdatingProduct;

    return (
        <Modal visible={showModal} animationType="slide" onRequestClose={handleCloseModal}>
            <View className="flex-1 bg-white">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1 bg-white"
                >
                    <ProductFormFields 
                        formData={formData}
                        handleInputChange={handleInputChange}
                        images={images}
                        pickImages={pickImages}
                        takePhoto={takePhoto}
                        removeImage={removeImage}
                        setShowCategoryModal={setShowCategoryModal}
                        setShowSubCategoryModal={setShowSubCategoryModal}
                        setShowConditionModal={setShowConditionModal}
                        setShowRegionModal={setShowRegionModal}
                        setShowDistrictModal={setShowDistrictModal}
                        showDeliveryConfig={showDeliveryConfig}
                        setShowDeliveryConfig={setShowDeliveryConfig}
                        showWarrantyConfig={showWarrantyConfig}
                        setShowWarrantyConfig={setShowWarrantyConfig}
                        showDiscountConfig={showDiscountConfig}
                        setShowDiscountConfig={setShowDiscountConfig}
                        handleSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        handleCloseModal={handleCloseModal}
                    />
                </KeyboardAvoidingView>
            </View>

            {/* Reusable Core Selection Picker Modals */}


            {/* Reusable Core Selection Picker Modals */}
            <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[75%] shadow-xl">
                        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)} className="p-1 bg-gray-100 rounded-full">
                                <Ionicons name="close" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={PRODUCT_CATEGORIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                    onPress={() => { handleInputChange('category', item); setShowCategoryModal(false); }}
                                >
                                    <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={showSubCategoryModal} transparent animationType="slide" onRequestClose={() => setShowSubCategoryModal(false)}>
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[75%] shadow-xl">
                        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">Select Subcategory</Text>
                            <TouchableOpacity onPress={() => setShowSubCategoryModal(false)} className="p-1 bg-gray-100 rounded-full">
                                <Ionicons name="close" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={
                                formData.category 
                                    ? SUB_CATEGORIES_BY_CATEGORY[formData.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || [] 
                                    : []
                            }
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                    onPress={() => { handleInputChange('productType', item); setShowSubCategoryModal(false); }}
                                >
                                    <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={showConditionModal} transparent animationType="slide" onRequestClose={() => setShowConditionModal(false)}>
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[75%] shadow-xl">
                        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">Select Condition</Text>
                            <TouchableOpacity onPress={() => setShowConditionModal(false)} className="p-1 bg-gray-100 rounded-full">
                                <Ionicons name="close" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={PRODUCT_CONDITIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                    onPress={() => { handleInputChange('condition', item); setShowConditionModal(false); }}
                                >
                                    <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={showRegionModal} transparent animationType="slide" onRequestClose={() => setShowRegionModal(false)}>
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[75%] shadow-xl">
                        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">Select Region</Text>
                            <TouchableOpacity onPress={() => setShowRegionModal(false)} className="p-1 bg-gray-100 rounded-full">
                                <Ionicons name="close" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={GHANA_REGIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                    onPress={() => { handleInputChange('region', item); setShowRegionModal(false); }}
                                >
                                    <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={showDistrictModal} transparent animationType="slide" onRequestClose={() => setShowDistrictModal(false)}>
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[75%] shadow-xl">
                        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">Select District</Text>
                            <TouchableOpacity onPress={() => setShowDistrictModal(false)} className="p-1 bg-gray-100 rounded-full">
                                <Ionicons name="close" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                    onPress={() => { handleInputChange('district', item); setShowDistrictModal(false); }}
                                >
                                    <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

export default CreateProductForm;


