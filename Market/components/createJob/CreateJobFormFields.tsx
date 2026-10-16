import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FormDropdown } from '../FormDropdown';

interface CreateJobFormFieldsProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    images: any[];
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
    setShowCategoryModal: (show: boolean) => void;
    setShowJobTypeModal: (show: boolean) => void;
    setShowWorkModeModal: (show: boolean) => void;
    setShowRegionModal: (show: boolean) => void;
    setShowDistrictModal: (show: boolean) => void;
    setShowCalendarModal: (show: boolean) => void;
    handleSubmit: () => Promise<void>;
    isSubmitting: boolean;
    handleClose: () => void;
}

export const CreateJobFormFields = ({
    formData,
    handleInputChange,
    images,
    pickImages,
    takePhoto,
    removeImage,
    setShowCategoryModal,
    setShowWorkModeModal,
    setShowRegionModal,
    setShowDistrictModal,
    setShowJobTypeModal,
    setShowCalendarModal,
    handleSubmit,
    isSubmitting,
    handleClose,
}: CreateJobFormFieldsProps) => {
    
    return (
        <ScrollView
            className="flex-1 px-5 py-4 bg-white mb-20"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View className="space-y-4 auto-cols-max pb-28">

                {/* Inline Action Bar Header */}
                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-gray-100">
                    <View>
                        <Text className="text-gray-900 font-extrabold text-xl">
                            {formData.title ? 'Modify Vacancy' : 'Job Specifications'}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-0.5 font-medium">
                            Please provide exact recruitment criteria
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleClose}
                        activeOpacity={0.7}
                        className="bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center"
                    >
                        <Ionicons name="close-outline" size={16} color="#4B5563" />
                        <Text className="text-gray-600 font-semibold text-xs ml-0.5">Cancel</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Media Picker Banner Section */}
                <View className="mb-4">
                    <Text className="text-black text-sm font-semibold mb-2">
                        Company Banner / Job Image ({images.length}/1)
                    </Text>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="flex-row">
                        
                        {/* 1. CAMERA BUTTON */}
                        {images.length < 1 && (
                            <TouchableOpacity
                                onPress={takePhoto}
                                className="w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-100 mr-2"
                            >
                                <Ionicons name="camera" size={24} color="#4B5563" />
                                <Text className="text-[10px] text-gray-500 mt-0.5 font-semibold">Take Photo</Text>
                            </TouchableOpacity>
                        )}

                        {/* 2. GALLERY BUTTON */}
                        {images.length < 1 && (
                            <TouchableOpacity
                                onPress={pickImages}
                                className="w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-100 mr-4"
                            >
                                <Ionicons name="images" size={24} color="#4B5563" />
                                <Text className="text-[10px] text-gray-500 mt-0.5 font-semibold">Add Gallery</Text>
                            </TouchableOpacity>
                        )}

                        {/* Banner Image Preview Container */}
                        {images.map((img: any, index: number) => (
                            <View key={index} className="w-24 h-20 mr-3 relative rounded-xl overflow-hidden bg-gray-100">
                                <Image source={{ uri: img.uri }} className="w-full h-full object-cover" />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center"
                                >
                                    <Ionicons name="close-circle" size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Company Information Inputs */}
                <FormInput
                    label="Company Name"
                    required
                    placeholder="e.g. MTN Ghana or Retail Shop"
                    value={formData.companyName}
                    onChangeText={(text) => handleInputChange("companyName", text)}
                />

                <FormInput
                    label="Job Position Title"
                    required
                    placeholder="e.g. Junior Front-End Developer"
                    value={formData.title}
                    onChangeText={(text) => handleInputChange("title", text)}
                />

                <FormInput
                    label="Core Job Description"
                    required
                    placeholder="Outline day-to-day duties..."
                    multiline
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={(text) => handleInputChange("description", text)}
                />

                <FormInput
                    label="Contact Phone Number"
                    placeholder="e.g. 0244000000 (Optional)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleInputChange("phoneNumber", text)}
                />

                <FormInput
                    label="Application Email Address"
                    placeholder="e.g. careers@company.com (Optional)"
                    keyboardType="email-address"
                    value={formData.emailForApplications}
                    onChangeText={(text) => handleInputChange("emailForApplications", text)}
                />

                {/* Industry Dropdown */}
                <FormDropdown
                    label="Job Category / Industry"
                    required
                    placeholder="Select Industry Classification"
                    value={formData.category}
                    onPress={() => setShowCategoryModal(true)}
                />
                 <FormDropdown
                    label="Employment Type"
                    required
                    placeholder="Select Job Type (Full-time, Part-time...)"
                    value={formData.jobType}
                    onPress={() => {
                        // If you are managing JOB_TYPES via a parent modal, change this trigger accordingly
                        Alert.alert(
                            "Select Employment Type",
                            "Choose an option",
                            [
                                { text: "Full-time", onPress: () => handleInputChange("jobType", "Full-time") },
                                { text: "Part-time", onPress: () => handleInputChange("jobType", "Part-time") },
                                { text: "Contract", onPress: () => handleInputChange("jobType", "Contract") },
                                { text: "Internship", onPress: () => handleInputChange("jobType", "Internship") },
                                { text: "Freelance", onPress: () => handleInputChange("jobType", "Freelance") },
                                { text: "Cancel", style: "cancel" }
                            ]
                        );
                    }}
                />
                {/* Work Environment Settings */}
                <FormDropdown
                    label="Work Mode Arrangement"
                    required
                    placeholder="Select Work Mode (On-site, Remote...)"
                    value={formData.workMode}
                    onPress={() => setShowWorkModeModal(true)}
                />

                {/* Salary Group Blocks */}
                <View className="flex-row space-x-3 w-full">
                    <View className="flex-1">
                        <FormInput
                            label="Min Salary (GHS)"
                            placeholder="Minimum salary"
                            keyboardType="numeric"
                            value={formData.salaryMin}
                            onChangeText={(text) => handleInputChange("salaryMin", text)}
                        />
                    </View>
                    <View className="flex-1">
                        <FormInput
                            label="Max Salary (GHS)"
                            placeholder="Maximum salary"
                            keyboardType="numeric"
                            value={formData.salaryMax}
                            onChangeText={(text) => handleInputChange("salaryMax", text)}
                        />
                    </View>
                </View>

                {/* Regional Geography Selector Parameters */}
                <FormDropdown
                    label="Region"
                    required
                    placeholder="Select Operating Region"
                    value={formData.region}
                    onPress={() => setShowRegionModal(true)}
                />

                <FormDropdown
                    label="District / City Location"
                    required
                    placeholder={formData.region ? "Select Local District" : "Please select a Region first"}
                    value={formData.district}
                    onPress={() => {
                        if (!formData.region) {
                            Alert.alert("Action Required", "Please choose a primary region first.");
                            return;
                        }
                        setShowDistrictModal(true);
                    }}
                />

                <FormInput
                    label="Specific Address / Landmark"
                    required
                    placeholder="e.g. Graphic Road, Opposite Total Station"
                    value={formData.location}
                    onChangeText={(text) => handleInputChange("location", text)}
                />

                  {/* Interactive Visual Grid Calendar Trigger Dropdown */}
                <FormDropdown
                    label="Application Deadline"
                    placeholder={
                        formData.applicationDeadline 
                            ? new Date(formData.applicationDeadline).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) 
                            : "Select closing date (Optional)"
                    }
                    value={formData.applicationDeadline ? "Date Selected" : ""}
                    onPress={() => setShowCalendarModal(true)}
                />

                {/* Requirements / Benefits Structured Fields */}
                
                <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-semibold mb-1">
                        Job Requirements (One criteria per line)
                    </Text>
                    <TextInput
                        className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3 bg-gray-50/50 text-gray-800 text-base"
                        placeholder="e.g.&#10;Proficient in React Native&#10;Good communication skills"
                        multiline
                        textAlignVertical="top"
                        value={formData.requirements}
                        onChangeText={(text) => handleInputChange("requirements", text)}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-semibold mb-1">
                        Perks & Benefits (One perk per line)
                    </Text>
                    <TextInput
                        className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3 bg-gray-50/50 text-gray-800 text-base"
                        placeholder="e.g.&#10;Health Insurance Cover&#10;Paid Annual Leave"
                        multiline
                        textAlignVertical="top"
                        value={formData.benefits}
                        onChangeText={(text) => handleInputChange("benefits", text)}
                    />
                </View>

                {/* Primary Core Publishing Execution Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    className={`w-full py-4 rounded-xl items-center flex-row justify-center mt-4 mb-12 ${
                        isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFF" className="mr-2" />
                    ) : null}
                    <Text className="text-white font-bold text-base">
                        {isSubmitting ? 'Publishing Listing...' : 'Publish Vacancy Posting'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};
