import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const FeedbackScreen = () => {
  return (
    <SafeScreen>
      {/* Header */}
       <Header title='Feedback'/>
      <Text>Feedback Screen</Text>
    </SafeScreen>
  )
}

export default FeedbackScreen