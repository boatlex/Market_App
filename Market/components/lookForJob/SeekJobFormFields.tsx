import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FormDropdown } from '../FormDropdown';

interface EducationItem {
    id?: string;
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string | Date;
    endDate?: string | Date;
    isCurrentEducation: boolean;
}

interface SeekJobFormFieldsProps {
    formData: {
        professionalHeadline: string;
        bio: string;
        skillsString: string;
        expectedSalaryMin: string;
        expectedSalaryCurrency: string;
        isSearchingForJob: boolean;
        region: string;
        district: string;
        location: string;
        phoneNumber: string;
        workMode: "On-site" | "Remote" | "Hybrid"; 
    };
    handleInputChange: (field: string, value: string | boolean) => void;
    images: any[];
    setFormData: React.Dispatch<React.SetStateAction<SeekJobFormFieldsProps['formData']>>;
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
    
    // 🌟 FIXED: Swapped 'any[]' out to use your strict structural interface definitions
    educationList: EducationItem[];
    setEducationList: React.Dispatch<React.SetStateAction<EducationItem[]>>;
    openEducationModal: () => void;

    openRegionPicker: () => void;
    openDistrictPicker: () => void;
    openCategoryPicker: () => void;
    openWorkModePicker: () => void;
    openJobTypePicker: () => void;
}

export const SeekJobFormFields = ({
    formData,
    handleInputChange,
    images,
    pickImages,
    takePhoto,
    removeImage,
    setFormData,
    educationList,
    setEducationList,
    openEducationModal,
    openRegionPicker,
    openDistrictPicker,
    openCategoryPicker,
    openWorkModePicker,
    openJobTypePicker
}: SeekJobFormFieldsProps) => {

    const handleRemoveEducation = (indexToRemove: number) => {
        setEducationList((prev: EducationItem[]) => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <ScrollView
            className="flex-1 px-6 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* 1. Profile Picture Management Canvas Segment */}
            <Text className="text-gray-700 text-sm font-bold mb-2">Profile Avatar / Avatar Banner</Text>
            <View className="mb-5 flex-row items-center gap-4">
                {images.length > 0 ? (
                    <View className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200">
                        <Image source={{ uri: images[0].uri }} className="w-full h-full" />
                        <TouchableOpacity
                            onPress={() => removeImage(0)}
                            className="absolute top-1 right-1 bg-black/60 p-1 rounded-full"
                        >
                            <Ionicons name="close-circle" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={pickImages}
                            className="w-24 h-24 border border-dashed border-gray-300 rounded-2xl justify-center items-center bg-gray-50/50"
                        >
                            <Ionicons name="image-outline" size={24} color="#6B7280" />
                            <Text className="text-gray-500 text-[10px] font-bold mt-1">Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={takePhoto}
                            className="w-24 h-24 border border-dashed border-gray-300 rounded-2xl justify-center items-center bg-gray-50/50"
                        >
                            <Ionicons name="camera-outline" size={24} color="#6B7280" />
                            <Text className="text-gray-500 text-[10px] font-bold mt-1">Camera</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* 2. Professional Summary Custom Fields */}
            <FormInput
                label="Professional Headline *"
                placeholder="e.g., Senior Full-Stack Engineer | React & Node.js Expert"
                value={formData.professionalHeadline}
                onChangeText={(val) => handleInputChange("professionalHeadline", val)}
            />

            <FormInput
                label="Professional Bio / Pitch Summary"
                placeholder="Tell employers about your background, strengths, and career highlights..."
                value={formData.bio}
                onChangeText={(val) => handleInputChange("bio", val)}
                multiline
                numberOfLines={4}
            />

            {/* 3. Core Tags Arrays Splitting Segment */}
            <FormInput
                label="Skills / Core Technologies (Comma separated)"
                placeholder="e.g., JavaScript, TypeScript, React Native, SQL"
                value={formData.skillsString}
                onChangeText={(val) => handleInputChange("skillsString", val)}
            />
            
            {/* 3. Phone Number */}
            <FormInput
                label="Phone Number (Optional)"
                placeholder="e.g., 0201145670"
                keyboardType="number-pad"
                value={formData.phoneNumber}
                maxLength={10}
                // 🌟 FIXED: Aligned type safety parameters inside the inline text modifier function block
                onChangeText={(text) => {
                    const cleanedText = text.replace(/[^0-9]/g, "");
                    setFormData((prev: SeekJobFormFieldsProps['formData']) => ({ 
                        ...prev, 
                        phoneNumber: cleanedText 
                    }));
                }}
            />

            {/* 4. Target Compensation Values */}
            <View className="mb-4 flex-row gap-3 items-end">
                <View className="flex-1">
                    <FormInput
                        label="Expected Min Salary"
                        placeholder="e.g., 5000"
                        keyboardType="numeric"
                        value={formData.expectedSalaryMin}
                        onChangeText={(val) => handleInputChange("expectedSalaryMin", val)}
                    />
                </View>
                <View className="w-[100px] mb-4">
                    <Text className="text-gray-700 text-sm font-bold mb-1.5">Currency</Text>
                    <View className="w-full border border-gray-200 rounded-xl py-3.5 bg-gray-100 text-gray-500 items-center justify-center">
                        <Text className="text-base font-bold text-gray-700">{formData.expectedSalaryCurrency}</Text>
                    </View>
                </View>
            </View>

            {/* 5. Custom Dynamic Dropdown Fields */}
            <FormDropdown
                label="Preferred Work Arrangement"
                value={formData.workMode}
                placeholder="Select arrangement..."
                onPress={openWorkModePicker}
            />

            <FormDropdown
                label="Target Location Region"
                value={formData.region}
                placeholder="Select preferred location region..."
                onPress={openRegionPicker}
            />

            <FormDropdown
                label="Municipal District"
                value={formData.district}
                placeholder="Select localized district..."
                onPress={openDistrictPicker}
            />

            {/* 6. Interactive Education Timeline Entry List Block */}
            <View className="mb-12 mt-2">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-700 text-sm font-bold">Education History</Text>
                    <TouchableOpacity
                        onPress={openEducationModal}
                        className="flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg"
                    >
                        <Ionicons name="add-circle-outline" size={16} color="#2563EB" />
                        <Text className="text-blue-600 text-xs font-bold">Add New</Text>
                    </TouchableOpacity>
                </View>

                {educationList.length === 0 ? (
                    <View className="p-4 bg-gray-50 rounded-xl border border-gray-100 items-center">
                        <Text className="text-gray-400 text-xs font-medium">No education details added yet.</Text>
                    </View>
                ) : (
                    <View className="gap-2">
                        {/* Continuing exactly from the educationList mapping loop */}
                        {educationList.map((edu: EducationItem, idx: number) => (
                            <View key={idx} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex-row justify-between items-center">
                                <View className="flex-1 pr-2">
                                    <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>{edu.schoolName}</Text>
                                    <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveEducation(idx)} className="p-1">
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* 7. Toggle Switch for Active Job Hunting Status */}
            <View className="mb-14 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex-row justify-between items-center">
                <View className="flex-1 pr-4">
                    <Text className="text-gray-900 font-bold text-sm mb-0.5">Visible to Recruiters</Text>
                    <Text className="text-gray-500 text-xs leading-normal">
                        Turn this on to appear in candidate pool searches across the platform.
                    </Text>
                </View>
                <Switch
                    trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
                    thumbColor={formData.isSearchingForJob ? "#2563EB" : "#F3F4F6"}
                    ios_backgroundColor="#E5E7EB"
                    value={formData.isSearchingForJob}
                    onValueChange={(text) => handleInputChange("isSearchingForJob", text)}
                />
            </View>
        </ScrollView>
    );
};
