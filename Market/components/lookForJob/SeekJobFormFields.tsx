import React from 'react';
import { View, Text, TouchableOpacity, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FormDropdown } from '../FormDropdown';

const PREFERRED_JOB_TYPE_OPTIONS = [
    "Full-time",
    "Part-time",
    "Contract",
    "Remote",
    "Internship",
    "Hybrid",
] as const;

interface EducationItem {
    id?: string;
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string | Date;
    endDate?: string | Date;
    isCurrentEducation: boolean;
}

interface FileAttachmentMeta {
    uri: string;
    type: string;
    name: string;
    isRemote: boolean;
}

interface SeekJobFormFieldsProps {
    formData: {
        professionalHeadline: string;
        bio: string;
        category: string;
        seekJobType: string;
        preferredJobTypes: string[]; 
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
    resumeFile?: FileAttachmentMeta | null;
    pickResume?: () => Promise<void>;
    removeResume?: () => void;
    educationList: EducationItem[];
    setEducationList: React.Dispatch<React.SetStateAction<EducationItem[]>>;
    openEducationModal: () => void;
    onEditEducation?: (index: number) => void;
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
    resumeFile,
    pickResume,
    removeResume,
    setFormData,
    educationList,
    setEducationList,
    openEducationModal,
    onEditEducation,
    openCategoryPicker,
    openJobTypePicker,
    openRegionPicker,
    openDistrictPicker,
    openWorkModePicker,
}: SeekJobFormFieldsProps) => {

    const handleRemoveEducation = (indexToRemove: number) => {
        setEducationList((prev: EducationItem[]) => prev.filter((_, index) => index !== indexToRemove));
    };


    const togglePreferredJobType = (type: string) => {
        setFormData((prev) => {
            const current = prev.preferredJobTypes || [];
            const exists = current.includes(type);
            return {
                ...prev,
                preferredJobTypes: exists
                    ? current.filter((t) => t !== type)
                    : [...current, type],
            };
        });
    };


    return (
        <View className="flex-1 pt-2">
            {/* 1. Profile Picture Management */}
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

            {/* 2. Professional Summary Fields */}
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

            {/* 3. Skills */}
            <FormInput
                label="Skills / Core Technologies (Comma separated)"
                placeholder="e.g., JavaScript, TypeScript, React Native, SQL"
                value={formData.skillsString}
                onChangeText={(val) => handleInputChange("skillsString", val)}
            />

            {/* 4. Phone Number */}
            <FormInput
                label="Phone Number *"
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

            {/* 5. Target Compensation Values */}
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
            

          {/* 6. Category, Job Type & Location Dropdowns */}
            <FormDropdown
                label="Job Category *"
                value={formData.category}
                placeholder="Select job category..."
                onPress={openCategoryPicker}
            />

            <FormDropdown
                label="Subcategory / Role *"
                value={formData.seekJobType}
                placeholder="Select subcategory..."
                onPress={openJobTypePicker}
            />

            <FormDropdown
                label="Preferred Work Arrangement"
                value={formData.workMode}
                placeholder="Select arrangement..."
                onPress={openWorkModePicker}
            />

            {/* Preferred Job Types Multi-Select Chips */}
            <View className="mb-4">
                <Text className="text-gray-700 text-sm font-bold mb-2">
                    Preferred Job Types
                </Text>
                <View className="flex-row flex-wrap gap-2">
                    {PREFERRED_JOB_TYPE_OPTIONS.map((type) => {
                        const isSelected = (formData.preferredJobTypes || []).includes(type);
                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => togglePreferredJobType(type)}
                                activeOpacity={0.75}
                                className={`px-3.5 py-2 rounded-full border ${
                                    isSelected
                                        ? "bg-blue-600 border-blue-600"
                                        : "bg-gray-50 border-gray-200"
                                }`}
                            >
                                <Text
                                    className={`text-xs font-bold ${
                                        isSelected ? "text-white" : "text-gray-700"
                                    }`}
                                >
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

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

            <FormInput
                label="Specific Area / Landmark"
                placeholder="e.g., East Legon, Accra"
                value={formData.location}
                onChangeText={(val) => handleInputChange("location", val)}
            />

            {/* 7. Resume PDF Attachment */}
            {pickResume && (
                <View className="mb-5">
                    <Text className="text-gray-700 text-sm font-bold mb-2">Resume / CV (PDF)</Text>
                    {resumeFile ? (
                        <View className="flex-row items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                            <View className="flex-row items-center flex-1 pr-2">
                                <Ionicons name="document-text" size={22} color="#2563EB" />
                                <Text className="text-gray-800 font-semibold text-sm ml-2.5 flex-1" numberOfLines={1}>
                                    {resumeFile.name}
                                </Text>
                            </View>
                            {removeResume && (
                                <TouchableOpacity onPress={removeResume} className="p-1">
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                                              <TouchableOpacity
                            onPress={pickResume}
                            className="flex-row items-center justify-center py-3.5 px-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 active:bg-gray-100"
                        >
                            <Ionicons name="cloud-upload-outline" size={20} color="#4B5563" />
                            <Text className="text-gray-600 font-bold text-xs ml-2">Upload PDF Resume (Max 5MB)</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

                  {/* 8. Education History List */}
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

                {educationList.length > 0 ? (
                    <View className="gap-2.5">
                        {educationList.map((edu, index) => (
                            <View
                                key={edu.id || index}
                                className="flex-row items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl"
                            >
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => onEditEducation?.(index)}
                                    className="flex-1 pr-2"
                                >
                                    <Text className="text-gray-900 font-bold text-sm">{edu.degree}</Text>
                                    <Text className="text-gray-600 text-xs mt-0.5">{edu.schoolName}</Text>
                                    {edu.fieldOfStudy ? (
                                        <Text className="text-gray-500 text-xs">{edu.fieldOfStudy}</Text>
                                    ) : null}
                                </TouchableOpacity>

                                <View className="flex-row items-center gap-1">
                                    {onEditEducation && (
                                        <TouchableOpacity
                                            onPress={() => onEditEducation(index)}
                                            className="p-1.5"
                                        >
                                            <Ionicons name="create-outline" size={18} color="#2563EB" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => handleRemoveEducation(index)}
                                        className="p-1.5"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text className="text-gray-400 text-xs italic">No education added yet.</Text>
                )}
            </View>


            {/* 9. Actively Searching Switch */}
            <View className="flex-row items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl mb-2">
                <View className="flex-1 pr-3">
                    <Text className="text-gray-900 font-bold text-sm">Actively Looking for Work</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">
                        Show your profile publicly to employers hiring in your category
                    </Text>
                </View>
                <Switch
                    value={formData.isSearchingForJob}
                    onValueChange={(val) => handleInputChange("isSearchingForJob", val)}
                    trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                    thumbColor={formData.isSearchingForJob ? "#2563EB" : "#F3F4F6"}
                />
            </View>
        </View>
    );
};
