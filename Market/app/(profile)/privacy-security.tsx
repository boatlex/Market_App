import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const PrivacyScreen = () => {
  return (
    <SafeScreen>
        <Header title='Privacy & Security'/>
      <Text>Privacy and Security Screen</Text>
    </SafeScreen>
  )
}

export default PrivacyScreen