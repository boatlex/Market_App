import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'


const BackButton = ({size=24, color="#000", weight="bold", }) => {

    const router = useRouter()
    return (
        <TouchableOpacity onPress={() => router.back()}>

            <Ionicons name='backspace-outline' size={size} color={color}  />

        </TouchableOpacity>
    )
}

export default BackButton