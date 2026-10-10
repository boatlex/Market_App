import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface FormDropdownProps {
    label: string;
    value: string;
    placeholder: string;
    onPress: () => void;
    required?: boolean;
}

export const FormDropdown = ({ label, value, placeholder, onPress, required = false }: FormDropdownProps) => {
    return (
        <View className="mb-4">
            <Text className="text-black text-sm font-semibold mb-1">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <TouchableOpacity
                onPress={onPress}
                className="border border-gray-300 rounded-lg p-3 bg-gray-100 flex-row justify-between items-center"
            >
                <Text className={value ? 'text-black' : 'text-gray-400'}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>
        </View>
    );
};
