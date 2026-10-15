import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header'

const PostServiceScreen = () => {
  return (
    <SafeScreen>
        <Header title='Services'/>
      <Text>Post Service Screen</Text>
    </SafeScreen>
  )
}

export default PostServiceScreen