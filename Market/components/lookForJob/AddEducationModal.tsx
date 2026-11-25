import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';

export interface EducationItem {
    id?: string;
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string | Date;
    endDate?: string | Date;
    isCurrentEducation: boolean;
}

interface AddEducationModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (education: EducationItem) => void;
    initialData?: EducationItem | null;
}

const INITIAL_EDUCATION_STATE = {
    schoolName: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrentEducation: false,
};

const formatDateInput = (val?: string | Date): string => {
    if (!val) return '';
    if (val instanceof Date) {
        return val.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return String(val);
};

export const AddEducationModal: React.FC<AddEducationModalProps> = ({
    visible,
    onClose,
    onSave,
    initialData = null,
}) => {
    const [education, setEducation] = useState(INITIAL_EDUCATION_STATE);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);



    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setEducation({
                    schoolName: initialData.schoolName || '',
                    degree: initialData.degree || '',
                    fieldOfStudy: initialData.fieldOfStudy || '',
                    startDate: formatDateInput(initialData.startDate),
                    endDate: formatDateInput(initialData.endDate),
                    isCurrentEducation: Boolean(initialData.isCurrentEducation),
                });
            } else {
                setEducation(INITIAL_EDUCATION_STATE);
            }
        }
    }, [visible, initialData]);

    const handleClose = () => {
        Keyboard.dismiss();
        setEducation(INITIAL_EDUCATION_STATE);
        onClose();
    };

    const handleSave = () => {
        if (!education.schoolName.trim() || !education.degree.trim() || !education.startDate.trim()) {
            Alert.alert('Missing Fields', 'Please populate school name, degree type, and start date.');
            return;
        }

        Keyboard.dismiss();
        onSave({
            ...(initialData?.id ? { id: initialData.id } : {}),
            schoolName: education.schoolName.trim(),
            degree: education.degree.trim(),
            fieldOfStudy: education.fieldOfStudy.trim() || undefined,
            startDate: education.startDate.trim(),
            endDate: education.isCurrentEducation ? undefined : education.endDate.trim() || undefined,
            isCurrentEducation: education.isCurrentEducation,
        });

        setEducation(INITIAL_EDUCATION_STATE);
        onClose();
    };

    const scrollToY = (yOffset: number) => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
        }, 120);
    };

      return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={handleClose}
        >
            {/* Bottom-aligned on mobile, centered dialog on laptop/desktop */}
            <View className="flex-1 justify-end md:justify-center md:p-6 bg-black/50">
                {/* Tap backdrop to dismiss keyboard (mobile bottom-sheet spacer) */}
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 md:hidden" />
                </TouchableWithoutFeedback>

                {/* Centered card with max-w-2xl on desktop and full width on mobile */}
                <View
                    className="w-full max-w-2xl self-center bg-white rounded-t-3xl md:rounded-3xl pt-5 shadow-lg overflow-hidden"
                    style={{ maxHeight: '90%' }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900">
                            {initialData ? 'Edit Education' : 'Add Education'}
                        </Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            activeOpacity={0.7}
                            className="p-1.5 bg-gray-100 rounded-full"
                        >
                            <Ionicons name="close" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Form Fields with Desktop Scrollbar */}
                    <ScrollView
                        ref={scrollViewRef}
                        className="w-full"
                        showsVerticalScrollIndicator={Platform.OS === 'web'}
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets={true}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingTop: 16,
                            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 40,
                        }}
                    >
                        <FormInput
                            label="School / Institution Name *"
                            placeholder="e.g. University of Ghana"
                            value={education.schoolName}
                            onChangeText={(text) => setEducation((prev) => ({ ...prev, schoolName: text }))}
                        />

                        <FormInput
                            label="Degree / Certificate *"
                            placeholder="e.g. BSc. Computer Science"
                            value={education.degree}
                            onChangeText={(text) => setEducation((prev) => ({ ...prev, degree: text }))}
                            onFocus={() => scrollToY(60)}
                        />

                        <FormInput
                            label="Field of Study"
                            placeholder="e.g. Information Technology"
                            value={education.fieldOfStudy}
                            onChangeText={(text) => setEducation((prev) => ({ ...prev, fieldOfStudy: text }))}
                            onFocus={() => scrollToY(140)}
                        />

                        <FormInput
                            label="Start Date *"
                            placeholder="e.g. Sept 2020"
                            value={education.startDate}
                            onChangeText={(text) => setEducation((prev) => ({ ...prev, startDate: text }))}
                            onFocus={() => scrollToY(230)}
                        />

                        {/* Currently Studying Switch */}
                        <View className="flex-row items-center justify-between my-3 py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
                            <Text className="text-sm font-medium text-gray-700">I currently study here</Text>
                            <Switch
                                value={education.isCurrentEducation}
                                onValueChange={(val) =>
                                    setEducation((prev) => ({
                                        ...prev,
                                        isCurrentEducation: val,
                                        endDate: val ? '' : prev.endDate,
                                    }))
                                }
                            />
                        </View>

                        {!education.isCurrentEducation && (
                            <FormInput
                                label="End Date"
                                placeholder="e.g. July 2024"
                                value={education.endDate}
                                onChangeText={(text) => setEducation((prev) => ({ ...prev, endDate: text }))}
                                onFocus={() => scrollToY(330)}
                            />
                        )}

                        <TouchableOpacity
                            onPress={handleSave}
                            activeOpacity={0.85}
                            className="w-full bg-blue-600 py-3.5 rounded-xl items-center mt-5"
                        >
                            <Text className="text-white font-bold text-base">
                                {initialData ? 'Update Education' : 'Save Education'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}