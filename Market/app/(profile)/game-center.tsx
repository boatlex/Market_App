import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const GameCenterScreen = () => {
  return (
    <SafeScreen>
      {/* Header */}
      <Header title='Games'/>
      <Text>Game Center Screen</Text>
    </SafeScreen>
  )
}

export default GameCenterScreen