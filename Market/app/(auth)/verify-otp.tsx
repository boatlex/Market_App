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
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
//import { useVerifyOTP } from '../../hooks/useVerifyOTP';

const VerifyOTPScreen = () => {
    const router = useRouter();

    // 1. Get the email passed forward from the register/login screen context
    const { email } = useLocalSearchParams<{ email: string }>();

    // State array tracking our 4-digit OTP code values
    const [otp, setOtp] = useState(['', '', '', '']);

    // References for shifting focus automatically across inputs
    const inputs = useRef<Array<TextInput | null>>([]);

    //const { mutate, isPending } = useVerifyOTP();
    const handleOtpChange = (text: string, index: number) => {
        // Clean the text to ensure it only contains digits
        const cleanedText = text.replace(/[^0-9]/g, '');

        // Check if the user is pasting a multi-digit string (e.g., "1234")
        if (cleanedText.length > 1) {
            // Split the pasted string into an array of single characters
            const pastedDigits = cleanedText.split('').slice(0, 4);

            // Create a new array, keeping existing values but overlaying the pasted ones
            const newOtp = [...otp];
            for (let i = 0; i < pastedDigits.length; i++) {
                if (index + i < 4) {
                    newOtp[index + i] = pastedDigits[i];
                }
            }
            setOtp(newOtp);

            // Automatically focus the last filled input box or dismiss keyboard if full
            const targetIndex = Math.min(index + pastedDigits.length - 1, 3);
            inputs.current[targetIndex]?.focus();
            return;
        }

        // Standard single-digit entry logic
        const newOtp = [...otp];
        newOtp[index] = cleanedText;
        setOtp(newOtp);

        // Automatically move focus forward if a digit was entered
        if (cleanedText && index < 3) {
            inputs.current[index + 1]?.focus();
        }
    };


    const handleKeyPress = (e: any, index: number) => {
        // If the user hits Backspace and the current box is already empty, move backward
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            // 1. Move keyboard focus to the previous input box
            inputs.current[index - 1]?.focus();

            // 2. Clear out the value of that previous box so they can re-type it
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };


    const handleVerification = () => {
        const fullOtpString = otp.join('');

        if (!email) {
            return Alert.alert('Error', 'Missing contextual email info. Please go back and try again.');
        }

        if (fullOtpString.length < 4) {
            return Alert.alert('Error', 'Please fill out all verification digits.');
        }

        Keyboard.dismiss();

        // 2. Dispatch payload matching the backend structure
        // mutate({
        //   email: email.toLowerCase().trim(),
        //   otp: fullOtpString
        // });
    };
    const isPending = false
    return (
        <SafeScreen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 bg-white"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 justify-center px-6">

                        <Text className="text-3xl font-bold text-slate-800 mb-2">
                            Verify OTP
                        </Text>

                        <Text className="text-base text-slate-500 mb-8 leading-6">
                            Enter the 4-digit authentication code sent to <Text className="font-semibold text-slate-700">{email || 'your email'}</Text>
                        </Text>

                        {/* 4-Digit Input Matrix Wrapper */}
                        <View className="flex-row justify-between mb-8 px-4">
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputs.current[index] = ref; }}
                                    className="w-14 h-14 border-2 border-slate-200 rounded-xl text-center text-xl font-bold bg-slate-50 text-slate-800 focus:border-blue-500"
                                    maxLength={1}
                                    keyboardType="number-pad"
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    editable={!isPending}
                                />
                            ))}
                        </View>

                        {/* Verification Trigger Button */}
                        <TouchableOpacity
                            className={`h-12 rounded-lg justify-center items-center mb-5 ${isPending ? 'bg-blue-300' : 'bg-blue-600 active:bg-blue-700'
                                }`}
                            onPress={handleVerification}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white text-base font-semibold">
                                    Verify Code
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} disabled={isPending}>
                            <Text className="text-blue-600 text-center text-sm font-medium">
                                Back
                            </Text>
                        </TouchableOpacity>

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
};

export default VerifyOTPScreen;
