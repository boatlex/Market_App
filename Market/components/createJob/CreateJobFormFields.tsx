import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
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
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track Y positions of lower fields for exact auto-scrolling
  const fieldPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (key: string) => {
    const y = fieldPositions.current[key];
    if (y !== undefined) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, y - 40),
          animated: true,
        });
      }, 150);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 px-5 py-4 bg-white"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 120,
      }}
    >
      <View className="space-y-4">
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
            {images.length < 1 && (
              <TouchableOpacity
                onPress={takePhoto}
                className="w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-100 mr-2"
              >
                <Ionicons name="camera" size={24} color="#4B5563" />
                <Text className="text-[10px] text-gray-500 mt-0.5 font-semibold">Take Photo</Text>
              </TouchableOpacity>
            )}

            {images.length < 1 && (
              <TouchableOpacity
                onPress={pickImages}
                className="w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-100 mr-4"
              >
                <Ionicons name="images" size={24} color="#4B5563" />
                <Text className="text-[10px] text-gray-500 mt-0.5 font-semibold">Add Gallery</Text>
              </TouchableOpacity>
            )}

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
          onChangeText={(text) => handleInputChange('companyName', text)}
        />

        <FormInput
          label="Job Position Title"
          required
          placeholder="e.g. Junior Front-End Developer"
          value={formData.title}
          onChangeText={(text) => handleInputChange('title', text)}
        />

        <FormInput
          label="Core Job Description"
          required
          placeholder="Outline day-to-day duties..."
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
        />

        <FormInput
          label="Contact Phone Number"
          placeholder="e.g. 0244000000 (Optional)"
          keyboardType="phone-pad"
          maxLength={10}
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
        />

        <FormInput
          label="Application Email Address"
          placeholder="e.g. careers@company.com (Optional)"
          keyboardType="email-address"
          value={formData.emailForApplications}
          onChangeText={(text) => handleInputChange('emailForApplications', text)}
        />

        {/* Dropdowns */}
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
          onPress={() => setShowJobTypeModal(true)}
        />

        <FormDropdown
          label="Work Mode"
          required
          placeholder="Select Work Mode"
          value={formData.workMode}
          onPress={() => setShowWorkModeModal(true)}
        />

        {/* Salary Range */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormInput
              label="Min Salary (GHS)"
              placeholder="e.g. 1500"
              keyboardType="numeric"
              value={formData.salaryMin}
              onChangeText={(text) => handleInputChange('salaryMin', text)}
            />
          </View>
          <View className="flex-1">
            <FormInput
              label="Max Salary (GHS)"
              placeholder="e.g. 3000"
              keyboardType="numeric"
              value={formData.salaryMax}
              onChangeText={(text) => handleInputChange('salaryMax', text)}
            />
          </View>
        </View>

        {/* Location */}
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
          placeholder={formData.region ? 'Select District' : 'Please select a Region first'}
          value={formData.district}
          onPress={() => setShowDistrictModal(true)}
        />

        <View
          onLayout={(e) => {
            fieldPositions.current.location = e.nativeEvent.layout.y;
          }}
        >
          <FormInput
            label="Specific Location / Landmark"
            required
            placeholder="e.g. East Legon, near A&C Mall"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            onFocus={() => scrollToField('location')}
          />
        </View>

        {/* Responsibilities, Requirements & Benefits */}
               {/* Responsibilities, Requirements & Benefits */}
        <View
          onLayout={(e) => {
            fieldPositions.current.responsibilities = e.nativeEvent.layout.y;
          }}
        >
          <FormInput
            label="Key Responsibilities (One per line)"
            placeholder="e.g. Build and maintain mobile app features"
            multiline
            numberOfLines={3}
            value={formData.responsibilities}
            onChangeText={(text) => handleInputChange('responsibilities', text)}
            onFocus={() => scrollToField('responsibilities')}
          />
        </View>

        <View
          onLayout={(e) => {
            fieldPositions.current.requirements = e.nativeEvent.layout.y;
          }}
        >
          <FormInput
            label="Requirements (One per line)"
            placeholder="e.g. 2+ years experience in React Native"
            multiline
            numberOfLines={3}
            value={formData.requirements}
            onChangeText={(text) => handleInputChange('requirements', text)}
            onFocus={() => scrollToField('requirements')}
          />
        </View>

        <View
          onLayout={(e) => {
            fieldPositions.current.benefits = e.nativeEvent.layout.y;
          }}
        >
          <FormInput
            label="Benefits (One per line)"
            placeholder="e.g. Health Insurance, Transport Allowance"
            multiline
            numberOfLines={3}
            value={formData.benefits}
            onChangeText={(text) => handleInputChange('benefits', text)}
            onFocus={() => scrollToField('benefits')}
          />
        </View>

        {/* Application Deadline */}
        <FormDropdown
          label="Application Deadline (Optional)"
          placeholder="Select Deadline Date"
          value={formData.applicationDeadline}
          onPress={() => setShowCalendarModal(true)}
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
          className={`py-4 rounded-xl items-center mt-4 ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">
              {formData.title && isSubmitting ? 'Saving...' : 'Publish Job Vacancy'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
