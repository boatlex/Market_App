import React, { useState, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { useAuth } from '../../app/contexts/authContext'; 

const ResetPasswordScreen = () => {
    const router = useRouter();
    const { token } = useLocalSearchParams<{ token?: string }>();

    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Ref to shift focus down the inputs smoothly
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const { resetPasswordMutation } = useAuth();

    const handleResetPassword = () => {
        if (!newPassword.trim() || !confirmNewPassword.trim()) {
            return Alert.alert('Error', 'Please fill out all fields.');
        }

        if (newPassword !== confirmNewPassword) {
            return Alert.alert('Error', 'Passwords do not match.');
        }

        if (!token) {
            return Alert.alert('Error', 'Invalid or missing recovery token. Please request another link.');
        }

        Keyboard.dismiss();

        resetPasswordMutation.mutate({
            token,
            newPassword: newPassword.trim(),
            confirmNewPassword: confirmNewPassword.trim()
        }, {
            onSuccess: (data) => {
                Alert.alert(
                    'Success',
                    data.message || 'Your password has been successfully reset!',
                    [{ text: 'Log In', onPress: () => router.replace('/') }]
                );
            },
            onError: (error: any) => {
                const backendMessage = error.response?.data?.message || 'Password reset failed. Please try again.';
                Alert.alert('Reset Failed', backendMessage);
            }
        });
    };
    const isPending = resetPasswordMutation.isPending;

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
                            Reset Password
                        </Text>

                        <Text className="text-base text-slate-500 mb-8 leading-6">
                            Please enter and confirm your new security password below.
                        </Text>

                        {/* New Password Input */}
                        <TextInput
                            className="h-12 border border-slate-200 rounded-lg px-4 text-base mb-4 bg-slate-50 text-slate-800 focus:border-blue-500"
                            placeholder="New Password"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            returnKeyType="next"
                            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                            blurOnSubmit={false}
                            editable={!isPending}
                        />

                        {/* Confirm New Password Input */}
                        <TextInput
                            ref={confirmPasswordInputRef}
                            className="h-12 border border-slate-200 rounded-lg px-4 text-base mb-6 bg-slate-50 text-slate-800 focus:border-blue-500"
                            placeholder="Confirm New Password"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleResetPassword}
                            editable={!isPending}
                        />

                        {/* Action Button */}
                        <TouchableOpacity
                            className={`h-12 rounded-lg justify-center items-center mb-5 ${
                                isPending ? 'bg-blue-300' : 'bg-blue-600 active:bg-blue-700'
                            }`}
                            onPress={handleResetPassword}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white text-base font-semibold">
                                    Update Password
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.replace('/')} disabled={isPending}>
                            <Text className="text-blue-600 text-center text-sm font-medium">
                                Cancel
                            </Text>
                        </TouchableOpacity>

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
};

export default ResetPasswordScreen;
