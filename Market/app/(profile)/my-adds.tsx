import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '../../components/SafeScreen'
import Header from '../../components/Header';
import { useRouter } from 'expo-router';

const MyAddsScreen = () => {
  const router = useRouter();

const handleEditPress = (product: any) => {
    router.push({
        pathname: '/sell', 
        params: { productData: JSON.stringify(product) }
    });
};
  return (
    <SafeScreen>
      {/* Header */}
      <Header title='My Adds'/>
      <Text>My Adds Screen</Text>
    </SafeScreen>
  )
}

export default MyAddsScreen