import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const MakeMoneyScreen = () => {
  return (
    <SafeScreen>
      {/* Header */}
      <Header title='Make Money'/>
      <Text>  Make Money Screen</Text>
    </SafeScreen>
  )
}

export default MakeMoneyScreen