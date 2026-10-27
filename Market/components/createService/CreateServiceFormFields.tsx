import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FormDropdown } from '../FormDropdown';
import { Image } from "expo-image";
import { ServiceProvider } from '../../types';

interface CreateServiceFormFieldsProps {
    formData: Partial<ServiceProvider>;
    handleInputChange: (field: string, value: any) => void;
    images: any[];
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
    openRegionPicker: () => void;
    openBasisPicker: () => void;
    openDistrictPicker: () => void;
    openCategoryPicker: () => void;
    openWorkModePicker: () => void;
      errors?: string[];
}

export const CreateServiceFormFields = ({
    formData,
    handleInputChange,
    images = [],
    pickImages,
    takePhoto,
    removeImage,
    openRegionPicker,
    openDistrictPicker,
    openCategoryPicker,
    openWorkModePicker,
    openBasisPicker,
      errors = []
    
}: CreateServiceFormFieldsProps) => {

    const totalImageCount = images.length;
    const hasError = (field: string) => errors.includes(field)

    return (
        <View className="flex-1 bg-white pb-10">
            <View className="space-y-4">

                {/* Media Picker Banner Section */}
                <View className="mb-4 px-1">
                    <Text className="text-gray-700 text-sm font-bold mb-2">
                        Company Banner / Job Image {totalImageCount}
                    </Text>

                    {/* 🔑 FIXED: Added 'flex-wrap w-full' container constraints to prevent layout squishing */}
                    <View className="flex-row flex-wrap w-full items-center gap-y-3">

                        {/* 1. CAMERA BUTTON */}
                        {images.length < 1 && (
                            <TouchableOpacity
                                onPress={takePhoto}
                                className="w-20 h-20 border border-dashed border-gray-300 rounded-xl items-center justify-center bg-gray-50/50 mr-2"
                            >
                                <Ionicons name="camera-outline" size={22} color="#4B5563" />
                                <Text className="text-[10px] text-gray-500 mt-1 font-bold">Camera</Text>
                            </TouchableOpacity>
                        )}

                        {/* 2. GALLERY BUTTON */}
                        {images.length < 1 && (
                            <TouchableOpacity
                                onPress={pickImages}
                                className="w-20 h-20 border border-dashed border-gray-300 rounded-xl items-center justify-center bg-gray-50/50 mr-4"
                            >
                                <Ionicons name="image-outline" size={22} color="#4B5563" />
                                <Text className="text-[10px] text-gray-500 mt-1 font-bold">Gallery</Text>
                            </TouchableOpacity>
                        )}

                        {/* Banner Image Preview Container */}
                        {images && (Array.isArray(images) ? images : [images]).map((img: any, index: number) => {
                            const imageUri = typeof img === 'string' ? img : (img?.uri || img?.url);

                            if (!imageUri) return null;
                            console.log("Preview url", imageUri);

                            return (
                                <View
                                    key={index}
                                    style={{ width: 80, height: 80 }}
                                    className="mr-3 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm"
                                >
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={200}
                                        cachePolicy="disk"
                                    />
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        activeOpacity={0.7}
                                        className="absolute top-1 right-1 bg-black/70 rounded-full w-5 h-5 items-center justify-center border border-white/20"
                                    >
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}

                    </View>
                </View>

               
                {/* 1. Business Name Input */}
                <View className="mb-2">
                    <FormInput
                        label="Business Name *"
                        placeholder="e.g. Mensah Plumbing Hub"
                        value={formData.businessName}
                        onChangeText={(text) => handleInputChange("businessName", text)}
                        // Pass an error condition modifier down to your custom component
                        className={hasError('businessName') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('businessName') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">Business Name is required.</Text>
                    )}
                </View>

                {/* 2. Service Specialty Dropdown */}
                <View className="mb-2">
                    <FormDropdown
                        label="Service Specialty / Category *"
                        placeholder="Select Service Industry"
                        value={formData.serviceType || ""}
                        onPress={openCategoryPicker}
                        className={hasError('serviceType') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('serviceType') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">Please select your trade category.</Text>
                    )}
                </View>

                {/* 3. Description Input */}
                <View className="mb-2">
                    <FormInput
                        label="Description *"
                        placeholder="Describe your skills, tools, and experience..."
                        multiline
                        numberOfLines={4}
                        value={formData.description}
                        onChangeText={(text) => handleInputChange("description", text)}
                        className={hasError('description') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('description') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">A description of your service is required.</Text>
                    )}
                </View>

                {/* 4. Pricing Complex Row Container */}
                <View className="flex-row gap-3 items-end mb-2">
                    {formData.pricing?.basis !== 'contact for quote' ? (
                        <View className="flex-1">
                            <FormInput
                                label="Pricing Rate (GHS) *"
                                placeholder="e.g. 250"
                                keyboardType="numeric"
                                value={formData.pricing?.rate?.toString() || ""}
                                onChangeText={(val) => handleInputChange("pricing", { 
                                    ...formData.pricing, 
                                    rate: val ? Number(val) : 0,
                                    currency: formData.pricing?.currency || 'GHS'
                                })}
                                className={hasError('rate') ? 'border-rose-500 bg-rose-50/20' : ''}
                            />
                            {hasError('rate') && (
                                <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">Provide a rate.</Text>
                            )}
                        </View>
                    ) : null}

                    <View className="flex-1">
                        <FormDropdown
                            label="Pricing Basis *"
                            placeholder="Select Basis"
                            value={formData.pricing?.basis || ""}
                            onPress={openBasisPicker} 
                        />
                    </View>
                </View>

                {/* 5. Region Dropdown */}
                <View className="mb-2">
                    <FormDropdown
                        label="Region *"
                        placeholder="Select Region"
                        value={formData.region || ""}
                        onPress={openRegionPicker}
                        className={hasError('region') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('region') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">Please specify your active operational region.</Text>
                    )}
                </View>

                {/* 6. District Dropdown */}
                <View className="mb-2">
                    <FormDropdown
                        label="District / City *"
                        placeholder="Select District"
                        value={formData.district || ""}
                        onPress={openDistrictPicker}
                        className={hasError('district') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('district') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">Please specify your district location.</Text>
                    )}
                </View>

                {/* 7. Detailed Location Input */}
                <View className="mb-2">
                    <FormInput
                        label="Detailed Location / Landmark *"
                        placeholder="e.g. Near East Legon Shell Signboard"
                        value={formData.location}
                        onChangeText={(text) => handleInputChange("location", text)}
                        className={hasError('location') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('location') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">Please provide a landmark location detail.</Text>
                    )}
                </View>

                {/* 8. Phone Number Input */}
                <View className="mb-2">
                    <FormInput
                        label="Business Phone Number *"
                        placeholder="e.g. 0244000000"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={formData.phoneNumber}
                        onChangeText={(text) => handleInputChange("phoneNumber", text.replace(/[^0-9]/g, ""))}
                        className={hasError('phoneNumber') ? 'border-rose-500 bg-rose-50/20' : ''}
                    />
                    {hasError('phoneNumber') && (
                        <Text className="text-rose-600 text-[11px] font-bold mt-1 px-1">A valid contact phone line is required.</Text>
                    )}
                </View>

                {/* WhatsApp Number (Optional - No validation checking required) */}
                <FormInput
                    label="WhatsApp Number (Optional)"
                    placeholder="e.g. 0244000000"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={formData.whatsappNumber}
                    onChangeText={(text) => handleInputChange("whatsappNumber", text.replace(/[^0-9]/g, ""))}
                />

                <FormDropdown
                    label="Availability Status *"
                    placeholder="Select Status"
                    value={formData.availabilityStatus || ""}
                    onPress={openWorkModePicker}
                />

            </View>
        </View>
    );
};
