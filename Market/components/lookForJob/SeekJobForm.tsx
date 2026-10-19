import { View, Modal, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, FlatList, ActivityIndicator, Switch, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useUpsertJobSeekerProfile } from '../../hooks/useUpsertJobSeekerProfile'
import { SeekJobFormFields } from './SeekJobFormFields'
import { Ionicons } from '@expo/vector-icons'
import { FormInput } from '../FormInput'
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS, 
    JOB_CATEGORIES,
    WORK_MODE, 
    JOB_TYPES
} from '../../constants/seekJob'
import SafeScreen from '../SafeScreen'

type WorkModeType = typeof WORK_MODE[number];

interface SeekJobFormProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingJob: any | null;
    setEditingJob: (job: any | null) => void;
    images: any[];
    setImages: (images: any[]) => void;
    pickImages: () => Promise<void>;
    takePhoto: () => Promise<void>;
    removeImage: (index: number) => void;
}

const FlatListPickerModal = ({
    visible,
    title,
    data,
    onSelect,
    onClose
}: {
    visible: boolean;
    title: string;
    data: readonly string[] | string[];
    onSelect: (item: string) => void;
    onClose: () => void;
}) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl max-h-[80%] pb-6">
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                    <Text className="text-gray-900 font-extrabold text-lg">{title}</Text>
                    <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
                        <Ionicons name="close" size={20} color="#4B5563" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={data as string[]}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="px-6 py-4 border-b border-gray-50 active:bg-blue-50"
                            onPress={() => {
                                onSelect(item);
                                onClose();
                            }}
                        >
                            <Text className="text-gray-800 font-medium text-base">{item}</Text>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    </Modal>
);

const SeekJobForm = ({
    showModal,
    setShowModal,
    editingJob,
    setEditingJob,
    images,
    setImages,
    pickImages,
    takePhoto,
    removeImage
}: SeekJobFormProps) => {
    const router = useRouter();
    const { mutateAsync, isPending } = useUpsertJobSeekerProfile();

    const [educationList, setEducationList] = useState<any[]>([]);
    const [showAddEducationModal, setShowAddEducationModal] = useState(false);
    
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);

    const [newEducation, setNewEducation] = useState({
        schoolName: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        isCurrentEducation: false
    });

    const [formData, setFormData] = useState({
        professionalHeadline: "",
        bio: "",
        skillsString: "",
        expectedSalaryMin: "",
        expectedSalaryCurrency: "GHS",
        isSearchingForJob: true,
        region: "",
        district: "",
        location: "",
        phoneNumber: "",
        workMode: "On-site" as WorkModeType
    });

    useEffect(() => {
        if (editingJob) {
            setFormData({
                professionalHeadline: editingJob.professionalHeadline || "",
                bio: editingJob.bio || "",
                skillsString: editingJob.skills ? editingJob.skills.join(", ") : "",
                expectedSalaryMin: editingJob.expectedSalary?.min ? String(editingJob.expectedSalary.min) : "",
                expectedSalaryCurrency: editingJob.expectedSalary?.currency || "GHS",
                isSearchingForJob: editingJob.isSearchingForJob !== undefined ? editingJob.isSearchingForJob : true,
                region: editingJob.region || "",
                district: editingJob.district || "",
                location: editingJob.location || "",
                phoneNumber: editingJob.phoneNumber || "",
                workMode: editingJob.workMode || "On-site"
            });
              
            setEducationList(editingJob.education || []);
            setImages(editingJob.profilePicture ? [{ uri: editingJob.profilePicture, isRemote: true }] : []);
        } else {
            resetForm();
        }
    }, [editingJob]);

    const resetForm = () => {
        setFormData({
            professionalHeadline: "",
            bio: "",
            skillsString: "",
            expectedSalaryMin: "",
            expectedSalaryCurrency: "GHS",
            isSearchingForJob: true,
            region: "",
            district: "",
            location: "",
            phoneNumber: "",
            workMode: "On-site"
        });
        setImages([]);
        setEducationList([]);
        setShowDistrictModal(false);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingJob(null);
        resetForm();

        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/profile' as any);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "region") {
                updated.district = "";
            }
            return updated;
        });
    };

    const handleAddEducation = () => {
        if (!newEducation.schoolName || !newEducation.degree || !newEducation.startDate) {
            Alert.alert("Missing Fields", "Please populate school name, degree type, and start date.");
            return;
        }
        
        setEducationList(prev => [...prev, { ...newEducation }]);
        setNewEducation({
            schoolName: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            isCurrentEducation: false
        });
        setShowAddEducationModal(false);
    };

    const handleSubmit = async () => {
        if (!formData.professionalHeadline) {
            Alert.alert("Missing Information", "Professional headline is required.");
            return;
        }

        const parsedSkillsArray = formData.skillsString
            ? formData.skillsString.split(",").map(s => s.trim()).filter(s => s !== "")
            : [];

        const localImageFile = images.find(img => !img.isRemote);

        try {
            await mutateAsync({
                professionalHeadline: formData.professionalHeadline,
                bio: formData.bio || undefined,
                skills: parsedSkillsArray,
                experience: editingJob?.experience || [], 
                education: educationList, 
                preferredJobTypes: editingJob?.preferredJobTypes || [],
                expectedSalaryMin: Number(formData.expectedSalaryMin) || 0,
                expectedSalaryCurrency: formData.expectedSalaryCurrency,
                isSearchingForJob: formData.isSearchingForJob,
                region: formData.region,
                district: formData.district,
                location: formData.location || undefined,
                phoneNumber: formData.phoneNumber,
                workMode: formData.workMode,
                profilePictureFile: localImageFile ? {
                    uri: localImageFile.uri,
                    name: localImageFile.name || `profile_${Date.now()}.jpg`,
                    type: localImageFile.type || 'image/jpeg'
                } : null
            });

            Alert.alert("Success", "Your profile has been saved successfully!", [
                { text: "OK", onPress: handleCloseModal }
            ]);
        } catch (error: any) {
            console.error("Profile submission hook error:", error);
            const errMsg = error?.response?.data?.message || "Failed to update profile. Please try again.";
            Alert.alert("Submission Error", errMsg);
        }
    };

    const availableDistricts = formData.region
        ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
        : [];

    return (
        <Modal visible={showModal} animationType="slide" onRequestClose={handleCloseModal}>
            <SafeScreen>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    className="flex-1 bg-white"
                >
                    {/* Header Navbar Top Panel */}
                    <View className="w-full border-b border-gray-100 px-6 py-4 flex-row justify-between items-center bg-white shadow-sm">
                        <TouchableOpacity onPress={handleCloseModal} className="p-1">
                            <Ionicons name="close" size={26} color="#1F2937" />
                        </TouchableOpacity>
                                              {/* Continuing exactly from the Navbar heading text */}
                        <Text className="font-extrabold text-lg text-gray-900">
                            {editingJob ? "Edit Job Ad" : "Create Job Seek Ad"}
                        </Text>
                        <TouchableOpacity 
                            onPress={handleSubmit} 
                            disabled={isPending}
                            className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center"
                        >
                            {isPending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text className="text-white font-bold text-sm">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Main Core Rendered Input Form Segment Fields Component */}
                    <View className="flex-1">
                        <SeekJobFormFields
                            formData={formData}
                            setFormData={setFormData}
                            handleInputChange={handleInputChange}
                            images={images}
                            pickImages={pickImages}
                            takePhoto={takePhoto}
                            removeImage={removeImage}
                            educationList={educationList}
                            setEducationList={setEducationList}
                            openEducationModal={() => setShowAddEducationModal(true)}
                            openRegionPicker={() => setShowRegionModal(true)}
                            openDistrictPicker={() => {
                                if (!formData.region) {
                                    Alert.alert("Region Required", "Please select a region first.");
                                    return;
                                }
                                setShowDistrictModal(true);
                            }}
                            openCategoryPicker={() => {}} 
                            openWorkModePicker={() => setShowWorkModeModal(true)}
                            openJobTypePicker={() => {}} 
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeScreen>

            {/* Custom Modals Selection Picker Overlays System */}
            <FlatListPickerModal
                visible={showWorkModeModal}
                title="Select Work Arrangement Mode"
                data={WORK_MODE}
                onSelect={(val) => handleInputChange("workMode", val)}
                onClose={() => setShowWorkModeModal(false)}
            />

            <FlatListPickerModal
                visible={showRegionModal}
                title="Select Preferred Location Region"
                data={GHANA_REGIONS}
                onSelect={(val) => handleInputChange("region", val)}
                onClose={() => setShowRegionModal(false)}
            />

            <FlatListPickerModal
                visible={showDistrictModal}
                title={`Select District in ${formData.region}`}
                data={availableDistricts}
                onSelect={(val) => handleInputChange("district", val)}
                onClose={() => setShowDistrictModal(false)}
            />

            {/* Sub-Timeline Modal: Add Education History Popup */}
            <Modal visible={showAddEducationModal} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="bg-white rounded-t-3xl max-h-[85%] p-6"
                    >
                        <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
                            <Text className="text-gray-900 font-extrabold text-lg">Add Education Info</Text>
                            <TouchableOpacity onPress={() => setShowAddEducationModal(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                            <View className="mb-4">
                                <FormInput
                                    label="School / University Name *"
                                    placeholder="e.g., University of Ghana"
                                    value={newEducation.schoolName}
                                    onChangeText={(val) => setNewEducation(p => ({ ...p, schoolName: val }))}
                                />
                            </View>
                            <View className="mb-4">
                                <FormInput
                                    label="Degree / Certification *"
                                    placeholder="e.g., Bachelor of Science"
                                    value={newEducation.degree}
                                    onChangeText={(val) => setNewEducation(p => ({ ...p, degree: val }))}
                                />
                            </View>
                            <View className="mb-4">
                                <FormInput
                                    label="Field of Study"
                                    placeholder="e.g., Computer Science"
                                    value={newEducation.fieldOfStudy}
                                    onChangeText={(val) => setNewEducation(p => ({ ...p, fieldOfStudy: val }))}
                                />
                            </View>
                            <View className="mb-4">
                                <FormInput
                                    label="Start Year / Date *"
                                    placeholder="e.g., 2020"
                                    value={newEducation.startDate}
                                    onChangeText={(val) => setNewEducation(p => ({ ...p, startDate: val }))}
                                />
                            </View>
                            
                            {!newEducation.isCurrentEducation && (
                                <View className="mb-4">
                                    <FormInput
                                        label="End Year / Date"
                                        placeholder="e.g., 2024"
                                        value={newEducation.endDate}
                                        onChangeText={(val) => setNewEducation(p => ({ ...p, endDate: val }))}
                                    />
                                </View>
                            )}

                            <View className="mb-6 flex-row items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <Text className="text-gray-800 font-bold text-sm">I am currently studying here</Text>
                                <Switch
                                    value={newEducation.isCurrentEducation}
                                    onValueChange={(val) => setNewEducation(p => ({ ...p, isCurrentEducation: val, endDate: val ? "" : p.endDate }))}
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleAddEducation}
                                className="w-full bg-blue-600 py-3.5 rounded-xl items-center justify-center shadow-sm active:bg-blue-700"
                            >
                                <Text className="text-white font-bold text-base">Add to Profile</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </Modal>
    );
};

export default SeekJobForm;
