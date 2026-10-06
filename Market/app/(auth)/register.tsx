import {
  Text, ScrollView, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, TouchableWithoutFeedback,
  Keyboard, Platform
} from 'react-native'
import React, { useState, useRef } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import BackButton from '../../components/BackButton'
import SafeScreen from '../../components/SafeScreen'
import { useAuth } from '../../contexts/authContext'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'


const Register = () => {
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()
  const { registerMutation } = useAuth()

  const firstNameInputRef = useRef<TextInput>(null)
  const lastNameInputRef = useRef<TextInput>(null)
  const emailInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)
  const confirmPasswordInputRef = useRef<TextInput>(null)

  const firstNameRef = useRef("")
  const lastNameRef = useRef("")
  const emailRef = useRef("")
  const passwordRef = useRef("")
  const confirmPasswordRef = useRef("")

  const handleSubmit = () => {
    const firstName = firstNameRef.current.trim()
    const lastName = lastNameRef.current.trim()
    const email = emailRef.current.trim()
    const password = passwordRef.current
    const confirmPassword = confirmPasswordRef.current

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Sign Up', 'Please Fill all the Fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Sign Up', 'Passwords do not match')
      return
    }

    Keyboard.dismiss()

    registerMutation.mutate({
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    }, {
      onSuccess: (data) => {
        Alert.alert("Success", data.message || "Manual user created successfully!", [
          { text: "OK", onPress: () => router.replace('/') }
        ])
      },
      onError: (error: any) => {
        const backendMessage = error.response?.data?.message || "Registration failed. Please try again."
        Alert.alert("Registration Error", backendMessage)
      }
    })
  }

  const isPending = registerMutation.isPending

  return (
    <SafeScreen>
      <KeyboardAwareScrollView
        className='flex-1 bg-gray-50'
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
         enableOnAndroid={true}
        extraScrollHeight={100} 
        enableAutomaticScroll={true}
      >

        <View className="items-stretch bg-gray-50">

          {/* Header & Logo Section */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View className="px-5 pt-5 pb-3 flex-row justify-between items-center">
                <BackButton size={30} />
                <Text className="text-gray-600 font-medium text-sm">Need Some Help?</Text>
              </View>

              <View className="items-center justify-center mb-4 mt-8">
                <View className='bg-red-400/30 rounded-full justify-center items-center size-24 self-center'>
                  <Image
                    source={require('../../assets/images/Didwa_Logo.png')}
                    resizeMode='contain'
                    className='size-14'
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* White Form Sheet Content Area */}
          <View className="bg-white rounded-t-[50px] pt-8 px-5 pb-20 shadow-sm">
            <View className="gap-1 mb-5">
              <Text className="text-3xl font-semibold text-black">Getting Started</Text>
              <Text className="text-lg font-semibold text-gray-400">Create Account to Proceed</Text>
            </View>

            {/* Core Form Element Body */}
            <View className="gap-4">

              {/* First Name Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'firstName' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name='person-circle' size={24} color={focusedField === 'firstName' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={firstNameInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your First Name'
                  onChangeText={(value) => firstNameRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  editable={!isPending}
                />
              </View>

              {/* Last Name Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'lastName' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name='person-circle' size={24} color={focusedField === 'lastName' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={lastNameInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your Last Name'
                  onChangeText={(value) => lastNameRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  editable={!isPending}
                />
              </View>

              {/* Email Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'email' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name='at' size={24} color={focusedField === 'email' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={emailInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your Email'
                  keyboardType='email-address'
                  autoCapitalize="none"
                  onChangeText={(value) => emailRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  editable={!isPending}
                />
              </View>

              {/* Password Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'password' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name='lock-closed' size={24} color={focusedField === 'password' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={passwordInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your Password'
                  secureTextEntry={!showPassword}
                  onChangeText={(value) => passwordRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  editable={!isPending}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color='gray' />
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'confirmPassword' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name='lock-closed' size={24} color={focusedField === 'confirmPassword' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={confirmPasswordInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Confirm Your Password'
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={(value) => confirmPasswordRef.current = value}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isPending}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color='gray' />
                </TouchableOpacity>
              </View>
               {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isPending}
                  className="h-14 bg-blue-500 rounded-2xl justify-center items-center mt-4"
                >
                  {isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">Register</Text>
                  )}
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeScreen>
  )
}

export default Register