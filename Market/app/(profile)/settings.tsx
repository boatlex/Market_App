import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image"
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../contexts/authContext';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';

const SettingsScreen = () => {
  const { logout } = useAuth()
  const router = useRouter()


  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are You Sure You Want to Logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "LogOut", style: "destructive",
        onPress: () => logout()
      }
    ])
  }
  return (
    <SafeScreen>
      {/* Header */}
      <Header title='Settings' />
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white mx-4 rounded-3xl p-2 shadow-sm mb-12">
          {/* Individual Navigation Row Component */}
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100"
             onPress={()=>router.push("/(profile)/account-settings")}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="settings-outline" size={22} color="gray" />
              <Text className="text-base font-medium text-black">Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100"
             onPress={()=>router.push("/(profile)/notifications")}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={22} color="gray" />
              <Text className="text-base font-medium text-black">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>


          {/* Privacy and Security Link */}
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
            activeOpacity={0.7}
            onPress={() => router.push("/(profile)/privacy-security")}
          >
            <View className='flex-row items-center gap-3'>
              <Ionicons name='shield-checkmark-outline' size={22} color={"#000"} />
              <Text className='text-base font-medium text-black'>Privacy and Security</Text>
            </View>
            <Ionicons name='chevron-forward' size={20} color={"#000"} />
          </TouchableOpacity>
        </View>
      </ScrollView>


      <View className='mb-10' >
        <TouchableOpacity
          className='flex-row items-center rounded-xl 
               justify-center py-5 mx-6 mb-3 border-2 border-gray-500/20'
          activeOpacity={0.8}
          onPress={handleSignOut}
        >
          <Ionicons name='log-out-outline' size={22} color={"#EF4444"} />
          <Text className='text-red-500 font-bold text-base ml-2'>Sign Out</Text>
        </TouchableOpacity>
        <Text className='mb-3 mx-6 text-xm text-black text-center'>Version 1.0.0</Text>
      </View>

      

    </SafeScreen>
  )
}

export default SettingsScreen