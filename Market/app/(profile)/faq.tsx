import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const FAQScreen = () => {
  return (
    <SafeScreen>
      <Header title='FAQ'/>
      <Text>FAQScreen</Text>
    </SafeScreen>
  )
}

export default FAQScreen