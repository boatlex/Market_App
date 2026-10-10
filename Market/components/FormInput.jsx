import { View, Text, TextInput, TextInputProps } from 'react-native';
import React from 'react';

interface FormInputProps extends TextInputProps {
    label: string;
    required?: boolean;
}

export const FormInput = ({ label, required = false, className, ...props }: FormInputProps) => {
    return (
        <View className="mb-4">
            <Text className="text-black text-sm font-semibold mb-1">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-3 text-black bg-gray-100"
                placeholderTextColor="#888"
                {...props}
            />
        </View>
    );
};
