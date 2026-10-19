import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FormDropdown } from '../FormDropdown';

interface SeekJobFormFieldsProps {
    formData: {
        professionalHeadline: string;
        bio: string;
        skillsString: string;
        expectedSalaryMin: string;
        expectedSalaryCurrency: string;
        isSearchingForJob: boolean;
        region?: string;
        district?: string;
        location?: string;
        workMode: string;
    };
    handleInputChange: (field: string, value: string | boolean) => void;
    images: any[];
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
    
    // 👇 Integrated the new profile array props from parent file sync
    educationList: any[];
    setEducationList: React.Dispatch<React.SetStateAction<any[]>>;
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
        setEducationList(prev => prev.filter((_, index) => index !== indexToRemove));
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
                        {/* Fixed the image layout reference index bug */}
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
                value={formData.region || ""}
                placeholder="Select preferred location region..."
                onPress={openRegionPicker}
            />

            <FormDropdown
                label="Municipal District"
                value={formData.district || ""}
                placeholder="Select localized district..."
                onPress={openDistrictPicker}
            />

            {/* 👇 6. Interactive Education Timeline Entry List Block */}
            <View className="mb-6 mt-2">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-700 text-sm font-bold">Education History</Text>
                    <TouchableOpacity 
                        onPress={openEducationModal}
                        className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 active:bg-blue-100"
                    >
                        <Ionicons name="add" size={14} color="#2563EB" />
                        <Text className="text-blue-600 text-xs font-black ml-0.5">Add Degree</Text>
                    </TouchableOpacity>
                </View>

                {educationList && educationList.length > 0 ? (
                    educationList.map((edu, idx) => (
                        <View key={idx} className="p-4 bg-gray-50 border border-gray-150 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                            <View className="flex-1 mr-4">
                                <Text className="text-gray-950 font-black text-sm">{edu.degree} in {edu.fieldOfStudy}</Text>
                                <Text className="text-gray-500 text-xs font-bold mt-0.5">{edu.schoolName}</Text>
                                <Text className="text-gray-400 text-[10px] font-medium mt-1">
                                    {edu.startDate} — {edu.isCurrentEducation ? "Present" : edu.endDate}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => handleRemoveEducation(idx)}
                                className="p-2 bg-red-50 rounded-full active:bg-red-100"
                            >
                                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <View className="p-4 border border-dashed border-gray-200 bg-gray-50/30 rounded-xl items-center justify-center">
                        <Text className="text-gray-400 text-xs italic font-medium">No institutional qualifications added yet.</Text>
                    </View>
                )}
            </View>

            {/* 7. Status Availability Toggle */}
            <View className="mb-16 mt-2 flex-row justify-between items-center p-4 bg-blue-50/40 border border-blue-100 rounded-xl">
                <View className="flex-1 mr-4">
                    <Text className="text-gray-950 font-black text-sm">Open to Work</Text>
                    <Text className="text-gray-400 text-xs mt-0.5 font-medium leading-relaxed">
                        Enabling this flag explicitly permits recruiters across Ghana to view your candidate details in matching search arrays.
                    </Text>
                </View>
                <Switch
                    trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
                    thumbColor={formData.isSearchingForJob ? "#2563EB" : "#9CA3AF"}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => handleInputChange("isSearchingForJob", val)}
                    value={formData.isSearchingForJob}
                />
            </View>
        </ScrollView>
    );
};
