import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from './FormInput';
import { FormDropdown } from './FormDropdown';

interface ProductFormFieldsProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    images: any[];
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    handleCloseModal: () => void;
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
    takePhoto,
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
    setShowDiscountConfig,
    handleCloseModal,
}: ProductFormFieldsProps) => {
    
    return (
        <ScrollView
            className={`flex-1 px-5 py-4 bg-white ${showDeliveryConfig || showDiscountConfig || showWarrantyConfig ? 'mb-28' : 'mb-20'}`}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
        >
            {/* FIXED: Removed layout-crashing 'auto-cols-max' grid class name */}
            <View className='space-y-4 pb-28'>

                {/* Inline Cancel / Title Action Bar Header */}
                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-gray-100">
                    <View>
                        <Text className="text-gray-900 font-extrabold text-xl">
                            {isEditing ? 'Modify Listing' : 'Listing Particulars'}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-0.5 font-medium">
                            Please provide exact marketplace specs
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleCloseModal}
                        activeOpacity={0.7}
                        className="bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center"
                    >
                        <Ionicons name="close-outline" size={16} color="#4B5563" />
                        <Text className="text-gray-600 font-semibold text-xs ml-0.5">Cancel</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Media Picker Section */}
                <View className="mb-4">
                    <Text className='text-black text-sm font-semibold mb-2'>
                        Product Photos ({images?.length || 0}/3)
                    </Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="flex-row">
                        
                        <TouchableOpacity
                            onPress={takePhoto}
                            className='w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-100 mr-2'
                        >
                            <Ionicons name="camera" size={24} color="#4B5563" />
                            <Text className='text-[10px] text-gray-500 mt-0.5 font-semibold'>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={pickImages}
                            className='w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-100 mr-4'
                        >
                            <Ionicons name="images" size={24} color="#4B5563" />
                            <Text className='text-[10px] text-gray-500 mt-0.5 font-semibold'>Add Gallery</Text>
                        </TouchableOpacity>

                        {images && images.map((img: any, index: number) => (
                            <View key={index} className='w-20 h-20 mr-3 relative rounded-xl overflow-hidden bg-gray-100'>
                                <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} />
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

                {/* Form Inputs (FIXED: Bound explicitly to destructured context values) */}
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

                <FormDropdown
                    label="Category"
                    required
                    placeholder="Select a Category"
                    value={formData.category}
                    onPress={() => setShowCategoryModal(true)}
                />

                <FormDropdown
                    label="Product Type / Subcategory"
                    required
                    placeholder={formData.category ? "Select Subcategory" : "Please select a Category first"}
                    value={formData.productType}
                    onPress={() => {
                        if (!formData.category) return;
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
                        if (!formData.region) return;
                        setShowDistrictModal(true);
                    }}
                />

                <FormInput
                    label="Specific Address / Landmark"
                    required
                    placeholder="e.g. Near Total Station, Accra"
                    value={formData.location}
                    onChangeText={(text) => handleInputChange("location", text)}
                />

                <FormInput
                    label="Description"
                    placeholder="Provide full description details about the listing..."
                    multiline
                    value={formData.description}
                    onChangeText={(text) => handleInputChange("description", text)}
                />

                {/* Additional Optional Feature Toggles */}
                <TouchableOpacity 
                    onPress={() => setShowWarrantyConfig(!showWarrantyConfig)}
                    className="flex-row items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl mt-2"
                >
                    <Text className="text-gray-700 font-bold text-sm">Add Product Warranty</Text>
                    <Ionicons name={showWarrantyConfig ? "checkbox" : "square-outline"} size={22} color={showWarrantyConfig ? "#2563eb" : "#9CA3AF"} />
                </TouchableOpacity>

                {showWarrantyConfig && (
                    <FormInput
                        label="Warranty Period"
                        placeholder="e.g. 6 Months, 1 Year"
                        value={formData.warranty}
                        onChangeText={(text) => handleInputChange("warranty", text)}
                    />
                )}

                <TouchableOpacity 
                    onPress={() => setShowDiscountConfig(!showDiscountConfig)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl"
                >
                    <View className="flex-row items-center space-x-2">
                        <Ionicons name="pricetag-outline" size={20} color="#4B5563" />
                        <Text className="text-gray-700 font-bold ml-2 text-sm">Specify Brand & Color</Text>
                    </View>
                    <Ionicons name={showDiscountConfig ? "checkbox" : "square-outline"} size={22} color={showDiscountConfig ? "#2563eb" : "#9CA3AF"} />
                </TouchableOpacity>

                {showDiscountConfig && (
                    <View style={{ gap: 12 }}>
                        <FormInput
                            label="Brand"
                            placeholder="e.g. Apple, Samsung, Nike"
                            value={formData.brand}
                            onChangeText={(text) => handleInputChange("brand", text)}
                        />
                        <FormInput
                            label="Color"
                            placeholder="e.g. Black, Silver, Blue"
                            value={formData.color}
                            onChangeText={(text) => handleInputChange("color", text)}
                        />
                    </View>
                )}

                {/* 3. Delivery Logistical Configuration Toggle */}
                <TouchableOpacity 
                    onPress={() => setShowDeliveryConfig(!showDeliveryConfig)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl"
                >
                    <View className="flex-row items-center space-x-2">
                        <Ionicons name="bus-outline" size={20} color="#4B5563" />
                        <Text className="text-gray-700 font-bold ml-2 text-sm">Estimated Delivery Framework</Text>
                    </View>
                    <Ionicons name={showDeliveryConfig ? "checkbox" : "square-outline"} size={22} color={showDeliveryConfig ? "#2563eb" : "#9CA3AF"} />
                </TouchableOpacity>

                {showDeliveryConfig && (
                    <View className="flex-row space-x-3 w-full">
                        <View className="flex-1">
                            <FormInput
                                label="Est. From (Days)"
                                placeholder="e.g. 1"
                                keyboardType="numeric"
                                value={formData.deliveryFrom}
                                onChangeText={(text) => handleInputChange("deliveryFrom", text)}
                            />
                        </View>
                        <View className="flex-1">
                            <FormInput
                                label="Est. To (Days)"
                                placeholder="e.g. 3"
                                keyboardType="numeric"
                                value={formData.deliveryTo}
                                onChangeText={(text) => handleInputChange("deliveryTo", text)}
                            />
                        </View>
                    </View>
                )}

                {/* Primary Multi-image Operational Publishing Action Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    className={`w-full py-4 rounded-xl items-center flex-row justify-center mt-6 mb-12 ${
                        isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFF" className="mr-2" />
                    ) : null}
                    <Text className="text-white font-bold text-base">
                        {isSubmitting ? 'Uploading Assets...' : (isEditing ? 'Save Changes' : 'Publish Ad')}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};
