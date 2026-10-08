import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const NotificationsScreen = () => {
  return (
    <SafeScreen>
      {/* Header */}
      <Header title='Notifications'/>
      <Text>Notifications Screen</Text>
    </SafeScreen>
  )
}

export default NotificationsScreen