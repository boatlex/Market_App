import { Text, View, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert } from 'react-native'
import React, { useState, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/authContext' 

const Login = () => {
  const [isEmailFocus, setIsEmailFocus] = useState(false)
  const [isPasswordFocus, setIsPasswordFocus] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const { loginMutation } = useAuth()

  const emailRef = useRef("")
  const passwordRef = useRef("")

  const handleLogin = () => {
    const email = emailRef.current.trim()
    const password = passwordRef.current

    if (!email || !password) {
      Alert.alert("Input Required", "Please fill in both email and password fields.")
      return
    }

    loginMutation.mutate({ email, password }, {
      onSuccess: (data) => {
        Alert.alert("Welcome!", data.message || "Logged in successfully!")
      },
      onError: (error: any) => {
        const backendMessage = error.response?.data?.message || "Invalid Email or Password."
        Alert.alert("Login Failed", backendMessage)
      }
    })
  }

  return (
    <View className="w-full mt-4">
      
      {/* Welcome Header */}
      <View className="gap-1 mb-6">
        <Text className="text-3xl font-semibold text-black">
          Welcome Back
        </Text>
        <Text className="text-lg font-medium text-gray-500">
          We are Excited to See you !
        </Text>
      </View>

      {/* Email Input Field */}
      <View 
        className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 border ${
          isEmailFocus ? 'border-orange-500' : 'border-transparent'
        }`}
      >
        <Ionicons name='at' size={24} color={isEmailFocus ? 'orange' : 'gray'} />
        <TextInput
          onFocus={() => setIsEmailFocus(true)}
          onBlur={() => setIsEmailFocus(false)}
          placeholderTextColor={'gray'}
          className="flex-1 text-black text-base"
          placeholder='Enter Your Email'
          keyboardType='email-address'
          autoCapitalize="none"
          onChangeText={(value) => emailRef.current = value}
        />
      </View>

      {/* Password Input Field */}
      <View 
        className={`flex-row items-center h-14 bg-gray-200 rounded-2xl px-4 gap-3 mt-4 border ${
          isPasswordFocus ? 'border-orange-500' : 'border-transparent'
        }`}
      >
        <Ionicons name='lock-closed-outline' size={24} color={isPasswordFocus ? 'orange' : 'gray'} />
        <TextInput
          onFocus={() => setIsPasswordFocus(true)}
          onBlur={() => setIsPasswordFocus(false)}
          placeholderTextColor={'gray'}
          className="flex-1 text-black text-base"
          placeholder='Enter Your Password'
          autoCapitalize="none"
          onChangeText={(value) => passwordRef.current = value}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color='gray'
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password Link */}
      <TouchableOpacity
        onPress={()=>router.push("/forgot-password")} 
        className="align-end items-end mt-2 self-end"
      >
        <Text className="text-blue-500 text-sm font-medium">Forgot Your Password?</Text>
      </TouchableOpacity>

      {/* Login Button wired with TanStack Loading States */}
      {loginMutation.isPending ? (
        <ActivityIndicator size={'large'} color="rgb(119, 129, 240)" className="mt-6" />
      ) : (
        <TouchableOpacity 
          onPress={handleLogin} 
          className="bg-[rgb(119,129,240)] justify-center items-center h-14 rounded-2xl mt-6 shadow-sm"
        >
          <Text className="color-white text-lg font-bold">Login</Text>
        </TouchableOpacity>
      )}

      {/* Redirect Footer */}
      <View className="flex-row justify-center items-center gap-1.5 mt-6">
        <Text className="text-gray-500 text-sm">
          You Don't Have an Account?
        </Text>
        <Pressable onPress={() => router.push('/register')}>
          <Text className="font-bold text-blue-600 text-sm">
            Sign Up Here
          </Text>
        </Pressable>
      </View>
      
    </View>
  )
}

export default Login
