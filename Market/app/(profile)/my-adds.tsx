import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const MyAddsScreen = () => {
  return (
    <SafeScreen>
      {/* Header */}
      <Header title='My Adds'/>
      <Text>My Adds Screen</Text>
    </SafeScreen>
  )
}

export default MyAddsScreen