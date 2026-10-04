import { View, Text } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

interface EmptyUiProps{
    title:string
    emptyMessage:string
    subMessage:string
}

const EmptyUi = ({title,emptyMessage, subMessage}:EmptyUiProps) => {
  return (
    <View className='flex-1 bg-background'>
      <View className='px-6 pt-16 pb-5'>
        <Text className='text-text-primary text-3xl font-bold tracking-tight'>{title}</Text>
      </View>
      <View className='flex-1 items-center justify-center px-6'>
        <Ionicons name='cart-outline' size={80} color={"#666"} />
        <Text className='text-text-primary text-xl font-semibold mt-4'>{subMessage}</Text>
        <Text className='text-text-secondary text-center mt-2'>
          {emptyMessage}</Text>
      </View>
    </View>
  )
}

export default EmptyUi