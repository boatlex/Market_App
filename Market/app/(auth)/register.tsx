import {
  KeyboardAvoidingView, Platform, Text, ScrollView, View,
  TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator,
  Image
} from 'react-native'
import React, { useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '../../components/BackButton'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import SafeScreen from '../../components/SafeScreen'
//import { userAuths } from '../../contexts/authContext'

const Register = () => {
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'confirmPassword' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  // const { signUp } = userAuths()
  const [isLoading, setIsLoading] = useState(false)

  const nameInputRef = useRef<TextInput>(null)
  const emailInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)
  const confirmPasswordInputRef = useRef<TextInput>(null)

  const nameRef = useRef("")
  const emailRef = useRef("")
  const passwordRef = useRef("")
  const confirmPasswordRef = useRef("")

  const handleSubmit = async () => {
    if (!nameRef.current || !emailRef.current || !passwordRef.current || !confirmPasswordRef.current) {
      Alert.alert('Sign Up', 'Please Fill all the Fields')
      return
    }

    if (passwordRef.current !== confirmPasswordRef.current) {
      Alert.alert('Sign Up', 'Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      //await signUp(nameRef.current, emailRef.current, passwordRef.current, "")
    } catch (error: any) {
      Alert.alert("Registration Error", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeScreen >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View className="flex-1 justify-between bg-gray-50">
          <View className="px-5 pt-5 pb-3 flex-row justify-between items-center">
            <BackButton size={30} />
            <Text className="text-gray-600 font-medium text-sm">Need Some Help?</Text>
          </View>

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

          <View className="flex-1 bg-white rounded-t-[50px] pt-3 px-5 shadow-sm">
            <ScrollView
              contentContainerStyle={{ gap: 15, marginTop: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-1 mb-5">
                <Text className="text-3xl font-semibold text-black">
                  Getting Started
                </Text>
                <Text className="text-lg font-semibold text-gray-400">
                  Create Account to Proceed/Continue
                </Text>
              </View>

              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'name' ? 'border-orange-500' : 'border-transparent'
                }`}>
                <Ionicons name='person-circle' size={24} color={focusedField === 'name' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={nameInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your Name'
                  onChangeText={(value) => nameRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              </View>

              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'email' ? 'border-orange-500' : 'border-transparent'
                }`}>
                <Ionicons name='at' size={24} color={focusedField === 'email' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={emailInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your Email'
                  keyboardType='email-address'
                  onChangeText={(value) => emailRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>

              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'password' ? 'border-orange-500' : 'border-transparent'
                }`}>
                <Ionicons name='lock-closed-outline' size={24} color={focusedField === 'password' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={passwordInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Enter Your Password'
                  onChangeText={(value) => passwordRef.current = value}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color='gray'
                  />
                </TouchableOpacity>
              </View>

              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'confirmPassword' ? 'border-orange-500' : 'border-transparent'
                }`}>
                <Ionicons name='lock-closed' size={24} color={focusedField === 'confirmPassword' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={'gray'}
                  ref={confirmPasswordInputRef}
                  className="flex-1 text-black text-base"
                  placeholder='Confirm Your Password'
                  onChangeText={(value) => confirmPasswordRef.current = value}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={22}
                    color='gray'
                  />
                </TouchableOpacity>
              </View>

              {/* Form Action Button */}
              {isLoading ? (
                <ActivityIndicator size={'large'} color="rgb(119, 129, 240)" className="mt-8" />
              ) : (
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-[rgb(119,129,240)] justify-center items-center h-14 rounded-2xl mt-8 shadow-sm"
                >
                  <Text className="text-white text-xl font-bold">Sign Up</Text>
                </TouchableOpacity>
              )}

              {/* Redirect Footer */}
              <View className="flex-row justify-center items-center gap-1.5 mt-5">
                <Text className="text-gray-500 text-sm">
                  Already Have an Account ?
                </Text>
                <Pressable onPress={() => router.push('/')}>
                  <Text className="font-bold text-blue-600 text-sm">
                    Login Here
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView >
    </SafeScreen >
  )
}

export default Register
