import React, { useState } from 'react';
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../app/contexts/authContext'; 

const ForgotPasswordScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const { forgotPasswordMutation } = useAuth();

    const handleResetRequest = () => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            return Alert.alert('Error', 'Please enter your email address.');
        }

        Keyboard.dismiss();

        forgotPasswordMutation.mutate(cleanEmail, {
            onSuccess: (data) => {
                Alert.alert(
                    'Email Sent',
                    data.message || 'A password reset link has been successfully sent to your inbox.',
                    [{ text: 'OK', onPress: () => router.replace('/') }]
                );
            },
            onError: (error: any) => {
                const backendMessage = error.response?.data?.message || 'Failed to dispatch reset link. Please try again.';
                Alert.alert('Request Failed', backendMessage);
            }
        });
    };

    const isPending = forgotPasswordMutation.isPending;

    return (
        <SafeScreen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 bg-white"
            >
                {/* Logo Container */}
                <View className="items-center justify-center mb-4 mt-8">
                    <View className='bg-red-400/30 rounded-full justify-center items-center size-24 self-center'>
                        <Image
                            source={require('../../assets/images/Didwa_Logo.png')}
                            resizeMode='contain'
                            className='size-14'
                        />
                    </View>
                </View>
                
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 justify-center px-6">

                        <Text className="text-3xl font-bold text-slate-800 mb-2">
                            Forgot Password
                        </Text>

                        <Text className="text-base text-slate-500 mb-8 leading-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </Text>

                        <TextInput
                            className="h-12 border border-slate-200 rounded-lg px-4 text-base mb-5 bg-slate-50 text-slate-800 focus:border-blue-500"
                            placeholder="Email Address"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={email}
                            onChangeText={setEmail}
                            returnKeyType="done"
                            onSubmitEditing={handleResetRequest}
                            editable={!isPending}
                        />

                        <TouchableOpacity
                            className={`h-12 rounded-lg justify-center items-center mb-5 ${
                                isPending ? 'bg-blue-300' : 'bg-blue-600 active:bg-blue-700'
                            }`}
                            onPress={handleResetRequest}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white text-base font-semibold">
                                    Send Reset Link
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/')} disabled={isPending}>
                            <Text className="text-blue-600 text-center text-sm font-medium">
                                Back to Login
                            </Text>
                        </TouchableOpacity>

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
};

export default ForgotPasswordScreen;
