import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from './FormInput';
import { FormDropdown } from './FormDropdown';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    tempFilters: any;
    setTempFilters: React.Dispatch<React.SetStateAction<any>>;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    setShowRegionModal: (show: boolean) => void;
    setShowDistrictModal: (show: boolean) => void;
    setShowCategoryModal: (show: boolean) => void;
    setShowConditionModal: (show: boolean) => void;
}

export const FilterModal = ({
    visible,
    onClose,
    tempFilters,
    setTempFilters,
    onApplyFilters,
    onResetFilters,
    setShowRegionModal,
    setShowDistrictModal,
    setShowCategoryModal,
    setShowConditionModal 
}: FilterModalProps) => {
    
    const updateFilterField = (field: string, value: string) => {
        setTempFilters((prev: any) => {
            const updated = { ...prev, [field]: value };
            if (field === "region") updated.district = "";  
            return updated;
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl h-[85%] p-5">
                    
                    {/* Header Controls */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-black">Filter Marketplace</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={26} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 space-y-4">
                        
                        {/* Budget Filtering Input Wrappers */}
                        <Text className="text-black text-sm font-semibold mb-1">Price Range (GHS)</Text>
                        <View className="flex-row space-x-3 mb-2">
                            <View className="flex-1">
                                <FormInput 
                                    label=""
                                    placeholder="Min Price"
                                    keyboardType="numeric"
                                    value={tempFilters.minPrice}
                                    onChangeText={(text) => updateFilterField("minPrice", text)}
                                />
                            </View>
                            <View className="flex-1">
                                <FormInput 
                                    label=""
                                    placeholder="Max Price"
                                    keyboardType="numeric"
                                    value={tempFilters.maxPrice}
                                    onChangeText={(text) => updateFilterField("maxPrice", text)}
                                />
                            </View>
                        </View>

                        {/* Location Context Targets */}
                        <FormDropdown 
                            label="Region"
                            placeholder="All Regions"
                            value={tempFilters.region}
                            onPress={() => setShowRegionModal(true)}
                        />

                        <FormDropdown 
                            label="District"
                            placeholder={tempFilters.region ? "All Districts" : "Select a Region First"}
                            value={tempFilters.district}
                            onPress={() => {
                                if (!tempFilters.region) {
                                    alert("Please choose a Region first.");
                                    return;
                                }
                                setShowDistrictModal(true);
                            }}
                        />

                        {/* Marketplace Categorization Selectors */}
                        <FormDropdown 
                            label="Category"
                            placeholder="All Categories"
                            value={tempFilters.category}
                            onPress={() => setShowCategoryModal(true)}
                        />

                        {/* Item Condition Selector */}
                        <FormDropdown 
                            label="Item Condition"
                            placeholder="All Conditions"
                            value={tempFilters.condition}
                            onPress={() => setShowConditionModal(true)}
                        />

                        {/* NEW: Item Listing Status (isAvailable) Segmented Controls */}
                        <View className="mb-2">
                            <Text className="text-black text-sm font-semibold mb-2">Item Listing Status</Text>
                            <View className="flex-row space-x-2">
                                
                                {/* Option A: All Listings */}
                                <TouchableOpacity
                                    onPress={() => updateFilterField("isAvailable", "")}
                                    className={`flex-1 h-11 rounded-xl items-center justify-center border ${
                                        tempFilters.isAvailable === "" || tempFilters.isAvailable === undefined
                                            ? 'bg-green-50 border-green-500' 
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text className={`font-semibold text-xs ${tempFilters.isAvailable === "" || tempFilters.isAvailable === undefined ? 'text-green-600' : 'text-gray-700'}`}>
                                        All Items
                                    </Text>
                                </TouchableOpacity>

                                {/* Option B: Available Only */}
                                <TouchableOpacity
                                    onPress={() => updateFilterField("isAvailable", "true")}
                                    className={`flex-1 h-11 rounded-xl items-center justify-center border ${
                                        tempFilters.isAvailable === "true" 
                                            ? 'bg-green-50 border-green-500' 
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text className={`font-semibold text-xs ${tempFilters.isAvailable === "true" ? 'text-green-600' : 'text-gray-700'}`}>
                                        Available
                                    </Text>
                                </TouchableOpacity>

                                {/* Option C: Sold Out */}
                                <TouchableOpacity
                                    onPress={() => updateFilterField("isAvailable", "false")}
                                    className={`flex-1 h-11 rounded-xl items-center justify-center border ${
                                        tempFilters.isAvailable === "false" 
                                            ? 'bg-green-50 border-green-500' 
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text className={`font-semibold text-xs ${tempFilters.isAvailable === "false" ? 'text-green-600' : 'text-gray-700'}`}>
                                        Sold Out
                                    </Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Action Footer */}
                    <View className="flex-row space-x-3 mt-4 pt-4 border-t border-gray-100">
                        <TouchableOpacity 
                            onPress={onResetFilters}
                            className="flex-1 py-4 border border-gray-300 rounded-xl items-center"
                        >
                            <Text className="text-gray-700 font-bold text-base">Clear All</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={onApplyFilters}
                            className="flex-1 py-4 bg-green-600 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-base">Apply Filters</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};
