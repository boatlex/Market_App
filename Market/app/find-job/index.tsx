import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header'

const FindJobScreen = () => {
  return (
    <SafeScreen>
         <Header title='Find Job'/>
      <Text>FindJobScreen</Text>
    </SafeScreen>
  )
}

export default FindJobScreen