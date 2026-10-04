import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import React from 'react'
import SafeScreen from './SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'


interface LoadingUiProps {
  title?: string;         
  message?: string;       
  showBackButton?: boolean; 
}

const LoadingUi = ({ 
  title, 
  message = "Loading...", 
  showBackButton = true 
}: LoadingUiProps) => {
  return (
    <SafeScreen>
      {/* Conditionally render header row if title exists or back button is enabled */}
      {(title || showBackButton) && (
        <View className='px-6 pb-5 border-b border-surface flex-row items-center'>
          {showBackButton && (
            <TouchableOpacity 
              className='mr-4'
              onPress={() => router.back()}
            >
              <Ionicons name='arrow-back' size={28} color={"#FFFFFF"}/>
            </TouchableOpacity>
          )}
          {title && (
            <Text className='text-text-primary font-bold text-2xl'>{title}</Text>
          )}
        </View>
      )}

      {/* Centered Loading Spinner */}
      <View className='flex-1 items-center justify-center px-6'>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text className='text-text-primary mt-4 font-medium text-center'>
          {message}
        </Text>
      </View>
    </SafeScreen>
  )
}

export default LoadingUi
