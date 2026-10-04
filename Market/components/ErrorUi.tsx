import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import SafeScreen from './SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'


interface ErrorUiProps {
  title?: string;          
  errorMessage?: string;   
  subMessage?: string;    
  onRetry?: () => void;    // Optional function to reload data
}

const ErrorUi = ({ 
  title = "Error", 
  errorMessage = "Something went wrong", 
  subMessage = "Please check your connection and try again",
  onRetry 
}: ErrorUiProps) => {
  return (
    <SafeScreen>
      {/* Header Row */}
      <View className='px-6 pb-5 border-b border-surface flex-row items-center'>
        <TouchableOpacity 
          className='mr-4'
          onPress={() => router.back()}
        >
          <Ionicons name='arrow-back' size={28} color={"#FFFFFF"}/>
        </TouchableOpacity>
        <Text className='text-text-primary font-bold text-2xl'>{title}</Text>
      </View>

      {/* Main Content */}
      <View className='flex-1 items-center justify-center px-6'>
        <Ionicons name='alert-circle-outline' color={"#FF6B6B"} size={68}/>
        
        <Text className='text-text-primary font-semibold text-xl mt-4 text-center'>
          {errorMessage}
        </Text>
        
        <Text className='text-text-secondary font-bold mt-2 text-center'>
          {subMessage}
        </Text>

        {/* Optional Retry Button */}
        {onRetry && (
          <TouchableOpacity 
            className='mt-6 bg-surface px-6 py-3 rounded-lg' 
            onPress={onRetry}
          >
            <Text className='text-text-primary font-semibold'>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeScreen>
  )
}

export default ErrorUi
