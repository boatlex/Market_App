import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from './FormInput';
import { FormDropdown } from './FormDropdown';

interface ProductFormFieldsProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    images: any;
    pickImages: () => Promise<void>;
    removeImage: (index: number) => void;
    setShowCategoryModal: (show: boolean) => void;
    setShowSubCategoryModal: (show: boolean) => void; 
    setShowConditionModal: (show: boolean) => void;
    setShowRegionModal: (show: boolean) => void;
    setShowDistrictModal: (show: boolean) => void;
    handleSubmit: () => Promise<void>;
    isSubmitting: boolean;
    isEditing: boolean;
    showDeliveryConfig: boolean;
    setShowDeliveryConfig: (val: boolean) => void;
    showWarrantyConfig: boolean;
    setShowWarrantyConfig: (val: boolean) => void;
    showDiscountConfig: boolean;
    setShowDiscountConfig: (val: boolean) => void;
}

export const ProductFormFields = ({
    formData,
    handleInputChange,
    images,
    pickImages,
    removeImage,
    setShowCategoryModal,
    setShowSubCategoryModal,
    setShowConditionModal,
    setShowRegionModal,
    setShowDistrictModal,
    handleSubmit,
    isSubmitting,
    isEditing,
    showDeliveryConfig,
    setShowDeliveryConfig,
    showWarrantyConfig,
    setShowWarrantyConfig,
    showDiscountConfig,
    setShowDiscountConfig
}: ProductFormFieldsProps) => {
    return (
        <ScrollView
            className={`flex-1 px-5 py-4
             bg-white ${showDeliveryConfig || showDiscountConfig || showWarrantyConfig ? 'mb-28' : 'mb-20'}`}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
        >
            <View className='space-y-4 auto-cols-max pb-28'>

                {/* Media Picker Section */}
                <View className="mb-4">
                    <Text className='text-black text-sm font-semibold mb-2'>
                        Product Photos ({images.length}/3)
                    </Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="flex-row">
                        <TouchableOpacity
                            onPress={pickImages}
                            className='w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-200 mr-3'
                        >
                            <Ionicons name="camera" size={26} color="#888" />
                            <Text className='text-[10px] text-gray-500 mt-1 font-medium'>Add Photo</Text>
                        </TouchableOpacity>

                        {images.map((img: any, index: number) => (
                            <View key={index} className='w-20 h-20 mr-3 relative rounded-xl overflow-hidden bg-gray-100'>
                                <Image source={{ uri: img.uri }} className='w-full h-full object-cover' />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    className='absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center'
                                >
                                    <Ionicons name="close-circle" size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Form Inputs */}
                <FormInput
                    label="Product Name"
                    required
                    placeholder="Enter item name..."
                    value={formData.name}
                    onChangeText={(text) => handleInputChange("name", text)}
                />

                <FormInput
                    label="Price (GHS)"
                    required
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.price}
                    onChangeText={(text) => handleInputChange("price", text)}
                />

                <FormInput
                    label="Phone Number"
                    required
                    placeholder="e.g. 0244000000"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleInputChange("phoneNumber", text)}
                />

                {/* Primary Category Selector */}
                <FormDropdown
                    label="Category"
                    required
                    placeholder="Select a Category"
                    value={formData.category}
                    onPress={() => setShowCategoryModal(true)}
                />

                {/* Swapped out Text Input for a dynamic dependent Subcategory selector Dropdown */}
                <FormDropdown
                    label="Product Type / Subcategory"
                    required
                    placeholder={formData.category ? "Select Subcategory" : "Please select a Category first"}
                    value={formData.productType}
                    onPress={() => {
                        if (!formData.category) {
                            alert("Please choose a primary category first.");
                            return;
                        }
                        setShowSubCategoryModal(true);
                    }}
                />

                <FormDropdown
                    label="Condition"
                    required
                    placeholder="Select Condition Status"
                    value={formData.condition}
                    onPress={() => setShowConditionModal(true)}
                />

                <FormDropdown
                    label="Region"
                    required
                    placeholder="Select Region"
                    value={formData.region}
                    onPress={() => setShowRegionModal(true)}
                />

                <FormDropdown
                    label="District"
                    required
                    placeholder={formData.region ? "Select District" : "Please select a Region first"}
                    value={formData.district}
                    onPress={() => {
                        if (!formData.region) {
                            alert("Please pick a region before selecting your district.");
                            return;
                        }
                        setShowDistrictModal(true);
                    }}
                />

                <FormInput
                    label="Specific Location / Area Landmark"
                    required
                    placeholder="e.g. East Legon, Spintex, near Shell Station"
                    value={formData.location}
                    onChangeText={(text) => handleInputChange("location", text)}
                />

                <FormInput
                    label="Description"
                    required
                    placeholder="Tell us more details about your item..."
                    multiline
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={(text) => handleInputChange("description", text)}
                />

                {/* Dynamic Optional Configurations Toggle Bar */}
                <View className="mb-4">
                    <Text className="text-black text-sm font-semibold mb-2">Additional Options (Optional)</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <TouchableOpacity
                            onPress={() => setShowDeliveryConfig(!showDeliveryConfig)}
                            className={`px-3 py-2 rounded-full border ${showDeliveryConfig ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-gray-300'}`}
                        >
                            <Text className={showDeliveryConfig ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                {showDeliveryConfig ? '✓ Delivery Info' : '+ Add Delivery'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowWarrantyConfig(!showWarrantyConfig)}
                            className={`px-3 py-2 rounded-full border ${showWarrantyConfig ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-gray-300'}`}
                        >
                            <Text className={showWarrantyConfig ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                {showWarrantyConfig ? '✓ Warranty' : '+ Add Warranty'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowDiscountConfig(!showDiscountConfig)}
                            className={`px-3 py-2 rounded-full border ${showDiscountConfig ? 'bg-green-100 border-green-600' : 'bg-gray-100 border-gray-300'}`}
                        >
                            <Text className={showDiscountConfig ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                {showDiscountConfig ? '✓ Specs & Brand' : '+ Add Specs / Brand'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* CONDITIONAL DELIVERY SECTION */}
                {showDeliveryConfig && (
                    <View className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                        <Text className="text-gray-700 font-bold text-xs uppercase tracking-wider mb-2">Delivery Windows</Text>
                        <FormInput
                            label="Estimated Days (From)"
                            placeholder="e.g. 1"
                            keyboardType="numeric"
                            value={formData.deliveryFrom || ""}
                            onChangeText={(text) => handleInputChange("deliveryFrom", text)}
                        />
                        <FormInput
                            label="Estimated Days (To)"
                            placeholder="e.g. 3"
                            keyboardType="numeric"
                            value={formData.deliveryTo || ""}
                            onChangeText={(text) => handleInputChange("deliveryTo", text)}
                        />
                    </View>
                )}

                {/* CONDITIONAL WARRANTY SECTION */}
                {showWarrantyConfig && (
                    <View className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                        <Text className="text-gray-700 font-bold text-xs uppercase tracking-wider mb-2">Warranty Details</Text>
                        <FormInput
                            label="Warranty Period"
                            placeholder="e.g. 6 Months Store Warranty, 1 Year Apple Warranty"
                            value={formData.warranty || ""}
                            onChangeText={(text) => handleInputChange("warranty", text)}
                        />
                    </View>
                )}

                {/* CONDITIONAL BRAND & COLOR SECTION */}
                {showDiscountConfig && (
                    <View className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                        <Text className="text-gray-700 font-bold text-xs uppercase tracking-wider mb-2">Specifications & Attributes</Text>
                        <FormInput
                            label="Product Brand"
                            placeholder="e.g. Samsung, Nike, Toyota"
                            value={formData.brand || ""}
                            onChangeText={(text) => handleInputChange("brand", text)}
                        />
                        <FormInput
                            label="Color"
                            placeholder="e.g. Midnight Black, Pearl White"
                            value={formData.color || ""}
                            onChangeText={(text) => handleInputChange("color", text)}
                        />
                    </View>
                )}

                {/* Action CTA Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl items-center justify-center mt-2 ${isSubmitting ? 'bg-gray-400' : 'bg-green-600'}`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text className='text-white font-bold text-base'>
                            {isEditing ? "Update Listing" : "Publish Ad"}
                        </Text>
                    )}
                </TouchableOpacity>

            </View>
        </ScrollView>

    );
};

