import React from 'react';
import { View, Text, TouchableOpacity, Image, Switch } from 'react-native';
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
    openWorkModePicker,
}: SeekJobFormFieldsProps) => {

    const handleRemoveEducation = (indexToRemove: number) => {
        setEducationList((prev: EducationItem[]) => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <View className="flex-1 pt-2">
            {/* 1. Profile Picture Management Canvas Segment */}
            <Text className="text-gray-700 text-sm font-bold mb-2">Profile Avatar / Portrait Photo</Text>
            <View className="mb-5 flex-row items-center gap-4">
                {images && images.length > 0 && images[0]?.uri ? (
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
                    <View className="w-full border border-gray-200 rounded-xl py-3.5 bg-gray-100 items-center justify-center">
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
            <View className="mb-6 mt-2">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-700 text-sm font-bold">Education History</Text>
                    <TouchableOpacity
                        onPress={openEducationModal}
                        className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg active:bg-blue-100"
                    >
                        <Ionicons name="add" size={16} color="#2563EB" />
                        <Text className="text-blue-600 font-extrabold text-xs ml-0.5">Add School</Text>
                    </TouchableOpacity>
                </View>

                {educationList.length === 0 ? (
                    <View className="border border-dashed border-gray-200 rounded-xl p-4 items-center justify-center bg-gray-50/30">
                        <Text className="text-gray-400 font-medium text-xs">No education details appended yet.</Text>
                    </View>
                ) : (
                    educationList.map((item, index) => {
                        const start = item.startDate ? new Date(item.startDate).getFullYear() : '';
                        const end = item.isCurrentEducation ? 'Present' : (item.endDate ? new Date(item.endDate).getFullYear() : '');

                        return (
                            <View key={index} className="flex-row items-center bg-white border border-gray-100 p-3.5 rounded-xl justify-between mb-2 shadow-sm">
                                <View className="flex-row items-start flex-1 mr-3">
                                    <View className="p-2 bg-gray-50 border border-gray-100 rounded-lg mt-0.5">
                                        <Ionicons name="school-outline" size={16} color="#4B5563" />
                                    </View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-950 text-xs font-black" numberOfLines={1}>
                                            {item.schoolName}
                                        </Text>
                                        <Text className="text-gray-500 font-medium text-[11px] mt-0.5" numberOfLines={1}>
                                            {item.degree} • {item.fieldOfStudy || 'General'}
                                        </Text>
                                        <Text className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                                            {start} - {end}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemoveEducation(index)}
                                    className="p-1.5 bg-rose-50 border border-rose-100 rounded-full active:bg-rose-100"
                                >
                                    <Ionicons name="trash-outline" size={14} color="#E11D48" />
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}
            </View>

            {/* 7. Active Job Seeking Visibility Switch Toggle */}
            <View className="flex-row justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl mb-12">
                <View className="flex-1 mr-4">
                    <Text className="text-gray-900 font-black text-sm mb-0.5">Visible to Employers</Text>
                    <Text className="text-gray-400 font-semibold text-[11px] leading-normal">
                        When enabled, your profile card flows instantly into the public Ghana candidate pool stream.
                    </Text>
                </View>
                <Switch
                    trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                    // Strict string-to-boolean runtime casting maps prevent Native state toggle locks
                    thumbColor={
                        formData.isSearchingForJob === true || String(formData.isSearchingForJob) === 'true'
                            ? '#2563EB'
                            : '#9CA3AF'
                    }
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => {
                        handleInputChange("isSearchingForJob", Boolean(val));
                    }}
                    value={formData.isSearchingForJob === true || String(formData.isSearchingForJob) === 'true'}
                />
            </View>
        </View>
    );
};

export default SeekJobFormFields;
