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

  const firstNameInputRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const lastNameInputRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const emailInputRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const passwordInputRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const confirmPasswordInputRef = useRef<React.ComponentRef<typeof TextInput>>(null)

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

    registerMutation.mutate(
      {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            "Verify Your Email",
            data.message || "An OTP verification code has been sent to your email.",
            [
              {
                text: "Enter OTP",
                onPress: () =>
                  router.push({
                    pathname: "/verify-otp",
                    params: { email: email.toLowerCase() },
                  }),
              },
            ]
          );
        },
        onError: (error: any) => {
          const backendMessage = error.response?.data?.message || "Registration failed. Please try again.";
          Alert.alert("Registration Error", backendMessage);
        },
      }
    );
  }

  const isPending = registerMutation.isPending
  const ScrollWrapper = Platform.OS === 'web' ? ScrollView : KeyboardAwareScrollView

  return (
    <SafeScreen>
      <ScrollWrapper
        className="flex-1 bg-gray-50"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
          paddingVertical: Platform.OS === 'web' ? 24 : 0,
        }}
        bounces={false}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        keyboardShouldPersistTaps="handled"
        {...(Platform.OS !== 'web' && {
          enableOnAndroid: true,
          extraScrollHeight: 100,
          enableAutomaticScroll: true,
        })}
      >
        {/* Centered Wrapper for Web / Desktop */}
        <View className="w-full md:max-w-lg md:mx-auto bg-gray-50">

          {/* Header & Logo Section */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
            <View>
              <View className="px-5 pt-5 pb-3 flex-row justify-between items-center">
                <BackButton size={30} />
                <Text className="text-gray-600 font-medium text-sm">Need Some Help?</Text>
              </View>

              <View className="items-center justify-center mb-4 mt-4 md:mt-2">
                <View className="bg-red-400/30 rounded-full justify-center items-center size-24 self-center">
                  <Image
                    source={require('../../assets/images/Didwa_Logo.png')}
                    resizeMode="contain"
                    style={{ width: 56, height: 56 }}
                    className="size-14"
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* White Form Sheet Content Area */}
          <View className="bg-white rounded-t-[50px] md:rounded-3xl pt-8 px-5 md:px-8 pb-20 md:pb-10 shadow-sm">
            <View className="gap-1 mb-5">
              <Text className="text-3xl font-semibold text-black">Getting Started</Text>
              <Text className="text-lg font-semibold text-gray-400">Create Account to Proceed</Text>
            </View>

            {/* Core Form Element Body */}
            <View className="gap-4">

              {/* First Name Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'firstName' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name="person-circle" size={24} color={focusedField === 'firstName' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="gray"
                  ref={firstNameInputRef}
                  className="flex-1 text-black text-base"
                  placeholder="Enter Your First Name"
                  onChangeText={(value) => firstNameRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  editable={!isPending}
                />
              </View>

              {/* Last Name Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'lastName' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name="person-circle" size={24} color={focusedField === 'lastName' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="gray"
                  ref={lastNameInputRef}
                  className="flex-1 text-black text-base"
                  placeholder="Enter Your Last Name"
                  onChangeText={(value) => lastNameRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  editable={!isPending}
                />
              </View>

              {/* Email Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'email' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name="at" size={24} color={focusedField === 'email' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="gray"
                  ref={emailInputRef}
                  className="flex-1 text-black text-base"
                  placeholder="Enter Your Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(value) => emailRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  editable={!isPending}
                />
              </View>

              {/* Password Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'password' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name="lock-closed" size={24} color={focusedField === 'password' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="gray"
                  ref={passwordInputRef}
                  className="flex-1 text-black text-base"
                  placeholder="Enter Your Password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onChangeText={(value) => passwordRef.current = value}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  editable={!isPending}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="gray" />
                </TouchableOpacity>
              </View>

                          {/* Confirm Password Input */}
              <View className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${focusedField === 'confirmPassword' ? 'border-orange-500' : 'border-transparent'}`}>
                <Ionicons name="lock-closed" size={24} color={focusedField === 'confirmPassword' ? 'orange' : 'gray'} />
                <TextInput
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="gray"
                  ref={confirmPasswordInputRef}
                  className="flex-1 text-black text-base"
                  placeholder="Confirm Your Password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onChangeText={(value) => confirmPasswordRef.current = value}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isPending}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="gray" />
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              {isPending ? (
                <ActivityIndicator size="large" color="rgb(119, 129, 240)" className="mt-4" />
              ) : (
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-[rgb(119,129,240)] justify-center items-center h-14 rounded-2xl mt-4 shadow-sm"
                >
                  <Text className="color-white text-lg font-bold">Sign Up</Text>
                </TouchableOpacity>
              )}

              {/* Redirect to Login Footer */}
              <View className="flex-row justify-center items-center gap-1.5 mt-4">
                <Text className="text-gray-500 text-sm">
                  Already Have an Account?
                </Text>
                <TouchableOpacity onPress={() => router.replace('/')} disabled={isPending}>
                  <Text className="font-bold text-blue-600 text-sm">
                    Login Here
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
      </ScrollWrapper>
    </SafeScreen>
  )
}

export default Register
