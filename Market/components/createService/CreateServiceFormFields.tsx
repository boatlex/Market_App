import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FormDropdown } from '../FormDropdown';
import { Image } from "expo-image";

interface CreateServiceFormFieldsProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    images: any[];
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
    openRegionPicker: () => void;
    openDistrictPicker: () => void;
    openCategoryPicker: () => void;
    openWorkModePicker: () => void;
    openJobTypePicker: () => void;
    openDatePicker: () => void;
}

export const CreateServiceFormFields = ({
    formData,
    handleInputChange,
    images,
    pickImages,
    takePhoto,
    removeImage,
    openRegionPicker,
    openDistrictPicker,
    openCategoryPicker,
    openWorkModePicker,
    openJobTypePicker,
    openDatePicker
}: CreateServiceFormFieldsProps) => {

    return (
        <View className="flex-1 bg-white pb-10">
            <View className="space-y-4">

                {/* Media Picker Banner Section */}
                <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-bold mb-2">
                        Company Banner / Job Image ({images.length}/1)
                    </Text>

                    {/* ✅  image primitives loops */}
                    <View className="flex-row">
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
                        {images && images.length > 0 && images.map((img: any, index: number) => {
                            // 🔒 SAFEGUARD: Extract a clean, resilient string URI regardless of local file structure variations
                            const imageUri = typeof img === 'string' ? img : (img?.uri || img?.url);

                            if (!imageUri) return null;

                            return (
                                <View key={index} className="w-24 h-24 mr-3 relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                    <Image
                                        // ✅ FIXED: Points directly to the single computed string token variable parameter context
                                        source={{ uri: imageUri }}
                                        className="w-full h-full"
                                        contentFit="cover"
                                        transition={200}      // ⚡ Elegant image fading transition
                                        cachePolicy="disk"     // 💾 Keeps asset records saved in local device storage
                                    />
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center border border-white/10"
                                    >
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}

                    </View>
                </View>

                {/* Company Information Inputs - Now rendering cleanly below the image row */}
                <FormInput
                    label="Company Name *"
                    placeholder="e.g. MTN Ghana or Retail Shop"
                    value={formData.companyName}
                    onChangeText={(text) => handleInputChange("companyName", text)}
                />

                <FormInput
                    label="Job Position Title *"
                    placeholder="e.g. Junior Front-End Developer"
                    value={formData.title}
                    onChangeText={(text) => handleInputChange("title", text)}
                />

                <FormInput
                    label="Core Job Description *"
                    placeholder="Outline day-to-day duties..."
                    multiline
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={(text) => handleInputChange("description", text)}
                />

                <FormInput
                    label="Contact Phone Number"
                    placeholder="e.g. 0244000000"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleInputChange("phoneNumber", text.replace(/[^0-9]/g, ""))}
                />

                <FormInput
                    label="Application Email Address"
                    placeholder="e.g. careers@company.com"
                    keyboardType="email-address"
                    value={formData.emailForApplications}
                    onChangeText={(text) => handleInputChange("emailForApplications", text)}
                />

                {/* Industry Dropdowns */}
                <FormDropdown
                    label="Job Category / Industry *"
                    placeholder="Select Industry Classification"
                    value={formData.category}
                    onPress={openCategoryPicker}
                />

                <FormDropdown
                    label="Employment Type *"
                    placeholder="Select Job Type"
                    value={formData.jobType}
                    onPress={openJobTypePicker}
                />

                <FormDropdown
                    label="Preferred Work Arrangement *"
                    placeholder="Select Arrangement (On-site, Remote...)"
                    value={formData.workMode}
                    onPress={openWorkModePicker}
                />

                {/* Financial Estimations Group */}
                <View className="mb-2 flex-row gap-3 items-end">
                    <View className="flex-1">
                        <FormInput
                            label="Min Salary"
                            placeholder="e.g. 3000"
                            keyboardType="numeric"
                            value={formData.salaryMin}
                            onChangeText={(val) => handleInputChange("salaryMin", val)}
                        />
                    </View>
                    <View className="flex-1">
                        <FormInput
                            label="Max Salary"
                            placeholder="e.g. 6000"
                            keyboardType="numeric"
                            value={formData.salaryMax}
                            onChangeText={(val) => handleInputChange("salaryMax", val)}
                        />
                    </View>
                </View>

                {/* Geographic Placement Components */}
                <FormDropdown
                    label="Target Job Location Region *"
                    placeholder="Select Region"
                    value={formData.region}
                    onPress={openRegionPicker}
                />

                <FormDropdown
                    label="Municipal District *"
                    placeholder="Select Localized District"
                    value={formData.district}
                    onPress={openDistrictPicker}
                />

                <FormInput
                    label="Street Address / Office Landmark Location *"
                    placeholder="e.g., Adjacent the Total Station, Airport Residential Area"
                    value={formData.location}
                    onChangeText={(text) => handleInputChange("location", text)}
                />

                {/* Split Multiline Block Text Segments */}
                <FormInput
                    label="Requirements & Qualifications (One per line)"
                    placeholder="e.g., Bachelor's Degree in CS&#10;3+ Years React Native Experience"
                    multiline
                    numberOfLines={4}
                    value={formData.requirements}
                    onChangeText={(text) => handleInputChange("requirements", text)}
                />

                <FormInput
                    label="Benefits & Perks (One per line)"
                    placeholder="e.g., Free Health Insurance&#10;Transport Allowance"
                    multiline
                    numberOfLines={4}
                    value={formData.benefits}
                    onChangeText={(text) => handleInputChange("benefits", text)}
                />
            </View>
        </View>
    );
};

export default CreateServiceFormFields;
