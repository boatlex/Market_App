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

interface FileAttachmentMeta {
    uri: string;
    type: string;
    name: string;
    isRemote: boolean;
}

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
    resumeFile: FileAttachmentMeta | null;
    pickResume: () => Promise<void>;
    removeResume: () => void;
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
    removeImage,
    resumeFile,
    pickResume,
    removeResume
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

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            let processedValue = value;
            if (field === 'isSearchingForJob') {
                processedValue = value === true || String(value) === 'true';
            }
            const updated = { ...prev, [field]: processedValue };
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
        const localResumeFile = resumeFile && !resumeFile.isRemote ? resumeFile : null;

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
                    name: localImageFile.name || 'avatar.jpg',
                    type: localImageFile.type || 'image/jpeg'
                } : null,
                resumeFile: localResumeFile ? {
                    uri: localResumeFile.uri,
                    name: localResumeFile.name,
                    type: localResumeFile.type
                } : null
            });

            Alert.alert("Success 🎉", "Profile information saved successfully.");
            handleCloseModal();
        } catch (err: any) {
            console.error("Mutation failed:", err);
            Alert.alert("Save Error", err.message || "Could not update your profile.");
        }
    };

    return (
        <Modal visible={showModal} animationType="fade" onRequestClose={handleCloseModal}>
            <SafeScreen>
                {/* Header Section */}
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <Text className="text-xl font-black text-gray-900">
                        {editingJob ? "Modify Profile" : "Setup Profile"}
                    </Text>
                    <TouchableOpacity onPress={handleCloseModal} className="p-2 bg-gray-50 border border-gray-100 rounded-full">
                        <Ionicons name="close" size={20} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        
                        {/* Resume File Upload Widget Section */}
                        <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                            <Text className="text-gray-950 font-black text-sm mb-1.5">Resume Attachment Document</Text>
                            <Text className="text-gray-400 text-xs font-semibold mb-4 leading-relaxed">
                                Upload a PDF copy of your CV so employers in Ghana can review your application directly.
                            </Text>

                            {resumeFile ? (
                                <View className="flex-row items-center bg-gray-50 border border-gray-100 p-3 rounded-xl justify-between">
                                    <View className="flex-row items-center flex-1 mr-3">
                                        <Ionicons name="document-text" size={24} color="#2563EB" />
                                        <View className="ml-2.5 flex-1">
                                            <Text className="text-gray-800 text-xs font-bold" numberOfLines={1}>
                                                {resumeFile.name}
                                            </Text>
                                            <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                                                {resumeFile.isRemote ? "Stored on Cloudinary" : "Staged Upload"}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={removeResume} className="p-1.5 bg-rose-50 rounded-full border border-rose-100 active:bg-rose-100">
                                        <Ionicons name="trash-outline" size={16} color="#E11D48" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    onPress={pickResume}
                                    className="border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-50"
                                >
                                    <Ionicons name="cloud-upload-outline" size={18} color="#2563EB" />
                                    <Text className="text-blue-600 font-extrabold text-xs ml-2">Attach PDF Resume</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Input Fields Content Layer */}
                        <SeekJobFormFields
                            formData={formData}
                            handleInputChange={handleInputChange}
                            images={images}
                            pickImages={pickImages}
                            takePhoto={takePhoto}
                            removeImage={removeImage}
                            setFormData={setFormData}
                            educationList={educationList}
                            setEducationList={setEducationList}
                            openEducationModal={() => setShowAddEducationModal(true)}
                            openRegionPicker={() => setShowRegionModal(true)}
                            openDistrictPicker={() => setShowDistrictModal(true)}
                            openWorkModePicker={() => setShowWorkModeModal(true)}
                            openCategoryPicker={() => {}}
                            openJobTypePicker={() => {}}
                        />

                        {/* Submit Button Component */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isPending}
                            className={`w-full py-4 rounded-xl mt-6 flex-row items-center justify-center ${
                                isPending ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700 shadow-sm'
                            }`}
                        >
                            {isPending ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                                    <Text className="text-white font-extrabold text-base">Uploading to Cloudinary...</Text>
                                </>
                            ) : (
                                <Text className="text-white font-extrabold text-base">Save & Sync Profile</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Independent Education popover modal containing KeyboardAvoidingView checks */}
                <Modal visible={showAddEducationModal} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end bg-black/50">
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="bg-white rounded-t-3xl max-h-[90%] pb-8">
                            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                                <Text className="text-gray-900 font-black text-base">Add Education Milestone</Text>
                                <TouchableOpacity onPress={() => setShowAddEducationModal(false)} className="p-1.5 bg-gray-100 rounded-full">
                                    <Ionicons name="close" size={18} color="#4B5563" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
                                <FormInput label="School Name *" placeholder="e.g., Ashesi University" value={newEducation.schoolName} onChangeText={(text) => setNewEducation((p: any) => ({ ...p, schoolName: text }))} />
                                <FormInput label="Degree / Certificate *" placeholder="e.g., Bachelor of Science" value={newEducation.degree} onChangeText={(text) => setNewEducation((p: any) => ({ ...p, degree: text }))} />
                                <FormInput label="Field of Study" placeholder="e.g., Computer Science" value={newEducation.fieldOfStudy} onChangeText={(text) => setNewEducation((p: any) => ({ ...p, fieldOfStudy: text }))} />
                                <FormInput label="Start Year *" placeholder="e.g., 2020" keyboardType="numeric" value={newEducation.startDate} onChangeText={(text) => setNewEducation((p: any) => ({ ...p, startDate: text }))} />
                                
                                {!newEducation.isCurrentEducation && (
                                    <FormInput label="End Year" placeholder="e.g., 2024" keyboardType="numeric" value={newEducation.endDate} onChangeText={(text) => setNewEducation((p: any) => ({ ...p, endDate: text }))} />
                                )}

                                <View className="flex-row justify-between items-center bg-gray-50 border border-gray-100 p-3.5 rounded-xl mb-6 mt-2">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-gray-900 font-black text-xs">Still Studying Here</Text>
                                        <Text className="text-gray-400 font-semibold text-[10px]">Toggle on if you haven't graduated yet.</Text>
                                    </View>
                                    <Switch
                                        trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                                        thumbColor={newEducation.isCurrentEducation ? '#2563EB' : '#9CA3AF'}
                                        value={newEducation.isCurrentEducation}
                                        onValueChange={(val) => setNewEducation((p: any) => ({ ...p, isCurrentEducation: val, endDate: val ? "" : p.endDate }))}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleAddEducation}
                                    className="w-full bg-blue-600 py-3.5 rounded-xl flex-row items-center justify-center active:bg-blue-700 shadow-sm"
                                >
                                    <Text className="text-white font-extrabold text-sm">Save to Timeline</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Dropdown region, district, and work mode pickers mapping parameters */}
                <FlatListPickerModal 
                    visible={showRegionModal} 
                    title="Select Region" 
                    data={GHANA_REGIONS} 
                    onSelect={(val) => handleInputChange("region", val)} 
                    onClose={() => setShowRegionModal(false)} 
                />
                
                <FlatListPickerModal 
                    visible={showDistrictModal} 
                    title="Select District" 
                    data={formData.region ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || [] : []} 
                    onSelect={(val) => handleInputChange("district", val)} 
                    onClose={() => setShowDistrictModal(false)} 
                />
                
                <FlatListPickerModal 
                    visible={showWorkModeModal} 
                    title="Select Work Mode" 
                    data={WORK_MODE} 
                    onSelect={(val) => handleInputChange("workMode", val)} 
                    onClose={() => setShowWorkModeModal(false)} 
                />
            </SafeScreen>
        </Modal>
    );
};

export default SeekJobForm;
