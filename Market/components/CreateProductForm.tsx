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
} from '../constansts'


interface CreateProductFormProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingProduct: any | null;
    setEditingProduct: (product: any | null) => void;
    images: any[];
    setImages: (images: any[]) => void;
    pickImages: () => Promise<void>;
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
        // Enforce validations including Phone Number matching server rules
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
        <View className='flex-1 bg-white'>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className='flex-1 bg-white'
            >
                {/* Top Header Role of Modal */}
                <View className="flex-row justify-between
                 items-center px-5 py-4 border-b border-gray-100">
                    <Text className="text-xl font-bold text-black">
                        {isEditing ? "Edit Product Details" : "Create New Ad"}
                    </Text>

                    <TouchableOpacity onPress={handleCloseModal}>
                        <Ionicons name="close" size={26} color="#333" />
                    </TouchableOpacity>
                </View>

                <ProductFormFields
                    formData={formData}
                    handleInputChange={handleInputChange}
                    images={images}
                    pickImages={pickImages}
                    removeImage={removeImage}
                    setShowCategoryModal={setShowCategoryModal}
                    setShowConditionModal={setShowConditionModal}
                    setShowRegionModal={setShowRegionModal}
                    setShowDistrictModal={setShowDistrictModal}
                    handleSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isEditing={isEditing}
                    showDeliveryConfig={showDeliveryConfig}
                    setShowDeliveryConfig={setShowDeliveryConfig}
                    showWarrantyConfig={showWarrantyConfig}
                    setShowWarrantyConfig={setShowWarrantyConfig}
                    showDiscountConfig={showDiscountConfig}
                    setShowDiscountConfig={setShowDiscountConfig}
                    setShowSubCategoryModal={setShowSubCategoryModal}
                />
            </KeyboardAvoidingView>

            {/* SELECTION MODALS */}

            {/* Category Sheet Modal */}
            <Modal visible={showCategoryModal} transparent={true} animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={PRODUCT_CATEGORIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        handleInputChange("category", item);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text className="text-black text-base">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Condition Sheet Modal */}
            <Modal visible={showConditionModal} transparent={true} animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">Select Condition</Text>
                            <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={PRODUCT_CONDITIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        handleInputChange("condition", item);
                                        setShowConditionModal(false);
                                    }}
                                >
                                    <Text className="text-black text-base">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Region Sheet Modal */}
            <Modal visible={showRegionModal} transparent={true} animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">Select Region(16)</Text>
                            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={GHANA_REGIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        handleInputChange("region", item);
                                        setShowRegionModal(false);
                                    }}
                                >
                                    <Text className="text-black text-base">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* District Sheet Modal */}
            <Modal visible={showDistrictModal} transparent={true} animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">Select District</Text>
                            <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={formData.region ? GHANA_DISTRICTS_BY_REGION[formData.region] || [] : []}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        handleInputChange("district", item);
                                        setShowDistrictModal(false);
                                    }}
                                >
                                    <Text className="text-black text-base">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            {/* Subcategory Sheet Modal */}
            <Modal visible={showSubCategoryModal} transparent={true} animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[50%] p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">Select Subcategory</Text>
                            <TouchableOpacity onPress={() => setShowSubCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={formData.category ? (SUB_CATEGORIES_BY_CATEGORY[formData.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || []) : []}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        handleInputChange("productType", item);
                                        setShowSubCategoryModal(false);
                                    }}
                                >
                                    <Text className="text-black text-base">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default CreateProductForm;

