
import { View, Text, TextInput, TextInputProps } from 'react-native';
import React from 'react';

interface FormInputProps extends TextInputProps {
    label: string;
    required?: boolean;
    containerClassName?: string; 
}

export const FormInput = ({ label, required = false, containerClassName = '', className = '', ...props }: FormInputProps) => {
    return (
        <View className={`mb-4 ${containerClassName}`}>
            <Text className="text-black text-sm font-semibold mb-1">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <TextInput
                
                className={`border border-gray-300 rounded-lg p-3 text-black bg-gray-100 ${className}`}
                placeholderTextColor="#888"
                {...props} 
            />
        </View>
    );
};
