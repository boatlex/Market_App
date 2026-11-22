import { View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useCreateProduct } from '../hooks/usecreateProduct';
import { ProductFormFields } from './ProductFormFields';
import { FlatListPickerModal } from './FlatListPickerModal';
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS,
    PRODUCT_CATEGORIES,
    PRODUCT_CONDITIONS,
    SUB_CATEGORIES_BY_CATEGORY,
} from '../constants/products';

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
    removeImage,
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
        deliveryTo: "",
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

            setImages(
                editingProduct.images
                    ? editingProduct.images.map((img: string) => ({ uri: img, isRemote: true }))
                    : []
            );
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
            deliveryTo: "",
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
        setFormData((prev) => {
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
        if (
            !formData.name ||
            !formData.price ||
            !formData.region ||
            !formData.condition ||
            !formData.category ||
            !formData.district ||
            !formData.location ||
            !formData.phoneNumber
        ) {
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
            delivery:
                showDeliveryConfig && (formData.deliveryFrom || formData.deliveryTo)
                    ? {
                          from: formData.deliveryFrom
                              ? new Date(
                                    Date.now() + parseInt(formData.deliveryFrom) * 24 * 60 * 60 * 1000
                                ).toISOString()
                              : undefined,
                          to: formData.deliveryTo
                              ? new Date(
                                    Date.now() + parseInt(formData.deliveryTo) * 24 * 60 * 60 * 1000
                                ).toISOString()
                              : undefined,
                      }
                    : undefined,
        };

        try {
            if (isEditing) {
                const retainedRemoteImages = images.filter((img) => img.isRemote).map((img) => img.uri);
                const localPicksOnly = images.filter((img) => !img.isRemote);

                if (retainedRemoteImages.length + localPicksOnly.length > 3) {
                    alert("Maximum 3 images allowed in total.");
                    return;
                }

                await updateProductAsync({
                    productId: editingProduct._id,
                    ...finalPayload,
                    images: localPicksOnly,
                    existingImages: retainedRemoteImages,
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
                    images: images,
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

    const availableSubCategories = formData.category
        ? SUB_CATEGORIES_BY_CATEGORY[
              formData.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY
          ] || []
        : [];

    const availableDistricts = formData.region
        ? GHANA_DISTRICTS_BY_REGION[
              formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION
          ] || []
        : [];

    if (!showModal) return null;


        const handleOpenSubCategoryModal = (open: boolean | ((prev: boolean) => boolean)) => {
        const shouldOpen = typeof open === 'function' ? open(showSubCategoryModal) : open;
        if (shouldOpen && !formData.category) {
            Alert.alert(
                "Select Category First",
                "Please choose a product category before selecting a subcategory."
            );
            return;
        }
        setShowSubCategoryModal(shouldOpen);
    };

    const handleOpenDistrictModal = (open: boolean | ((prev: boolean) => boolean)) => {
        const shouldOpen = typeof open === 'function' ? open(showDistrictModal) : open;
        if (shouldOpen && !formData.region) {
            Alert.alert(
                "Select Region First",
                "Please choose your region before selecting a district."
            );
            return;
        }
        setShowDistrictModal(shouldOpen);
    };


    return (
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
                    setShowSubCategoryModal={handleOpenSubCategoryModal}
                    setShowConditionModal={setShowConditionModal}
                    setShowRegionModal={setShowRegionModal}
                    setShowDistrictModal={handleOpenDistrictModal}
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

            {/* Conditionally Mounted Selection Picker Modals */}
            {showCategoryModal && (
                <FlatListPickerModal
                    visible={showCategoryModal}
                    title="Select Category"
                    data={[...PRODUCT_CATEGORIES]}
                    selectedValue={formData.category}
                    searchable={true}
                    searchPlaceholder="Search category..."
                    onSelect={(val) => {
                        handleInputChange('category', val);
                        setShowCategoryModal(false);
                    }}
                    onClose={() => setShowCategoryModal(false)}
                />
            )}

            {showSubCategoryModal && (
                <FlatListPickerModal
                    visible={showSubCategoryModal}
                    title="Select Subcategory"
                    data={availableSubCategories}
                    selectedValue={formData.productType}
                    searchable={true}
                    searchPlaceholder="Search subcategory..."
                    onSelect={(val) => {
                        handleInputChange('productType', val);
                        setShowSubCategoryModal(false);
                    }}
                    onClose={() => setShowSubCategoryModal(false)}
                />
            )}

            {showConditionModal && (
                <FlatListPickerModal
                    visible={showConditionModal}
                    title="Select Condition"
                    data={[...PRODUCT_CONDITIONS]}
                    selectedValue={formData.condition}
                    searchable={false}
                    onSelect={(val) => {
                        handleInputChange('condition', val);
                        setShowConditionModal(false);
                    }}
                    onClose={() => setShowConditionModal(false)}
                />
            )}

            {showRegionModal && (
                <FlatListPickerModal
                    visible={showRegionModal}
                    title="Select Region"
                    data={[...GHANA_REGIONS]}
                    selectedValue={formData.region}
                    searchable={true}
                    searchPlaceholder="Search region..."
                    onSelect={(val) => {
                        handleInputChange('region', val);
                        setShowRegionModal(false);
                    }}
                    onClose={() => setShowRegionModal(false)}
                />
            )}

            {showDistrictModal && (
                <FlatListPickerModal
                    visible={showDistrictModal}
                    title="Select District"
                    data={availableDistricts}
                    selectedValue={formData.district}
                    searchable={true}
                    searchPlaceholder="Search district or city..."
                    onSelect={(val) => {
                        handleInputChange('district', val);
                        setShowDistrictModal(false);
                    }}
                    onClose={() => setShowDistrictModal(false)}
                />
            )}
        </View>
    );
};

export default CreateProductForm;
