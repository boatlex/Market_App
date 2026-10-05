import { View, Text, Alert } from 'react-native'
import { useState } from 'react'
import { useAuth, useSSO } from '@clerk/expo' 
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession()

type AuthStrategy = 'oauth_google' | 'oauth_apple';

const useSocialAuth = () => {
  const [loadingStrategy, setLoadingStrategy] = useState<AuthStrategy | null>(null)
  const { startSSOFlow } = useSSO()

  const handleSocialAuth = async (strategy: AuthStrategy) => {
    setLoadingStrategy(strategy)
    try {
      const redirectUrl = Linking.createURL('oauth-native-callback', { scheme: 'market' });
      
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: strategy,
        redirectUrl: redirectUrl,
      })

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId }) 
      } else {
        setLoadingStrategy(null)
      }
      
    } catch (error) {
      console.error('SocialAuth Authentication Error:', error)
      const provider = strategy === "oauth_google" ? "Google" : "Apple"
      Alert.alert("Error", `Failed to sign in with ${provider}. Please try again`)
      
      setLoadingStrategy(null)
    }
  }

  return { loadingStrategy, handleSocialAuth }
}

export default useSocialAuth


