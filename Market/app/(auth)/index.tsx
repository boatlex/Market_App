import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import useSocialAuth from '../hooks/useSocialAuth'
import * as WebBrowser from "expo-web-browser"
import Login from '../../components/Login'

WebBrowser.maybeCompleteAuthSession()

const AuthScreen = () => {
  const { loadingStrategy, handleSocialAuth } = useSocialAuth()
  const isAnyLoading = loadingStrategy !== null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
        showsVerticalScrollIndicator={false}
        className="px-6 py-10"
      >
        {/* 1. Full-Screen Loading Overlay */}
        {isAnyLoading && (
          <View
            className='absolute inset-0 bg-white z-50 justify-center items-center'
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            <ActivityIndicator size="large" color="#4285f4" />
            <Text className='mt-4 text-gray-600 font-medium'>Signing you in...</Text>
          </View>
        )}

        {/* Logo Container */}
        <View className="items-center justify-center mb-4 mt-8">
          <View className='bg-red-400/30 rounded-full justify-center items-center size-24 self-center'>
            <Image 
              source={require('../../assets/images/Didwa_Logo.png')}
              resizeMode='contain'
              className='size-14'
            />
          </View>
        </View>

        {/* Manual Login Form */}
        <View className="w-full">
          <Login />
        </View>

        {/* Separator Divider */}
        <View className="flex-row items-center my-6 w-full">
          <View className="flex-1 h-[1px] bg-gray-300" />
          <Text className="mx-4 text-gray-400 font-medium text-sm">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300" />
        </View>

        {/* OAuth Buttons Section */}
        <View className='w-full gap-3'>
          {/* Google Button */}
          <TouchableOpacity 
            className='flex-row justify-center items-center bg-white rounded-full px-6 border border-gray-300 py-3 shadow-sm'
            onPress={() => handleSocialAuth("oauth_google")}
            disabled={isAnyLoading}
          >
            <View className='flex-row items-center justify-center'>
              <Image 
                source={require('../../assets/images/gmail-png.png')}
                resizeMode='contain'
                className='size-8 mr-3'
              />
              <Text className='text-black font-semibold text-base'>Continue With Google</Text>
            </View>
          </TouchableOpacity>

          {/* Apple Button */}
          <TouchableOpacity 
            className='flex-row justify-center items-center bg-white rounded-full px-6 border border-gray-300 py-3 shadow-sm'
            onPress={() => handleSocialAuth("oauth_apple")}
            disabled={isAnyLoading}
          >
            <View className='flex-row items-center justify-center'>
              <Image 
                source={require('../../assets/images/apple.png')}
                resizeMode='contain'
                className='size-7 mr-3'
              />
              <Text className='text-black font-semibold text-base'>Continue With Apple</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal Footer */}
        <Text className='text-center text-gray-400 text-xs leading-4 mt-8 px-4 mb-4' >
          By Signing Up, You Agree to Our <Text className='text-blue-500 font-medium'>Terms</Text>{", "}
          <Text className='text-blue-500 font-medium'>Privacy Policy</Text> {", and "}
          <Text className='text-blue-500 font-medium'>Cookie Use</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AuthScreen



