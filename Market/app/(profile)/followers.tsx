import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';

const FollowersScreen = () => {
  const Followers =true
  return (
    <SafeScreen>
      {/* Header */}
      <Header title={`${Followers?"Followers":"Following"}`}/>
      <Text>Followers Screen</Text>
    </SafeScreen>
  )
}

export default FollowersScreen