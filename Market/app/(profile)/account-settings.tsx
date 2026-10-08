import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const AccountSettingsScreen = () => {
  return (
    <SafeScreen>
      <Header title='Account Settings'/>
      <Text> Account Settings Screen</Text>
    </SafeScreen>
  )
}

export default AccountSettingsScreen