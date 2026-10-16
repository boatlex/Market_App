import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CreateListingOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateListingOptionsModal = ({ visible, onClose }: CreateListingOptionsModalProps) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-5 pb-8 shadow-xl">
          {/* Header Action Row */}
          <View className="flex-row justify-between items-center mb-5 pb-2 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">What would you like to post?</Text>
            <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Option 1: Marketplace Product */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/sell')}
            className="flex-row items-center p-4 mb-3 bg-blue-50/50 border border-blue-100 rounded-xl active:bg-blue-50"
          >
            <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mr-4">
              <Ionicons name="cart" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-base">Marketplace Product</Text>
              <Text className="text-xs text-gray-500">Sell phones, electronics, vehicles, or clothes</Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Professional Service */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/post-service')}
            className="flex-row items-center p-4 mb-3 bg-amber-50/50 border border-amber-100 rounded-xl active:bg-amber-50"
          >
            <View className="w-10 h-10 bg-amber-500 rounded-lg items-center justify-center mr-4">
              <Ionicons name="build" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-base">Offer a Service</Text>
              <Text className="text-xs text-gray-500">Post tutoring, plumbing, graphic design, or catering</Text>
            </View>
          </TouchableOpacity>

          {/* Option 3: Recruiter Hiring Job */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/post-job')}
            className="flex-row items-center p-4 mb-3 bg-purple-50/50 border border-purple-100 rounded-xl active:bg-purple-50"
          >
            <View className="w-10 h-10 bg-purple-500 rounded-lg items-center justify-center mr-4">
              <Ionicons name="briefcase" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-base">Post a Job Vacancy (Hiring)</Text>
              <Text className="text-xs text-gray-500">List an open role to find qualified Ghanaian candidates</Text>
            </View>
          </TouchableOpacity>

          {/* Option 4: Candidate Seeking Job */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/post-seeking-job')}
            className="flex-row items-center p-4 bg-teal-50/50 border border-teal-100 rounded-xl active:bg-teal-50"
          >
            <View className="w-10 h-10 bg-teal-500 rounded-lg items-center justify-center mr-4">
              <Ionicons name="person" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 text-base">Advertise Yourself (Seeking Job)</Text>
              <Text className="text-xs text-gray-500">Upload your skills and CV summary to catch employers' attention</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};
