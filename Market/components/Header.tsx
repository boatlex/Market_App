import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'


interface AddressHeaderProps {
  title: string;
}


const Header = ({ title }: AddressHeaderProps) => {
  return (
     <View className='px-6 pb-5 pt-3 border-b border-surface flex-row items-center'>
        <TouchableOpacity 
          className='mr-4'
          onPress={() => router.back()}
        >
          <Ionicons name='arrow-back' size={28} color={"#000"}/>
        </TouchableOpacity>
        <Text className=' font-bold text-2xl'>{title}</Text>
    </View>
  )
}

export default Header