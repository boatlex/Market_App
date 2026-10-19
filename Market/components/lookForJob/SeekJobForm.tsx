import { View, Modal, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, FlatList, ActivityIndicator, Switch, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useUpsertJobSeekerProfile } from '../../hooks/useUpsertJobSeekerProfile'
import { SeekJobFormFields } from './SeekJobFormFields'
import { Ionicons } from '@expo/vector-icons'
import { FormInput } from '../FormInput'
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS, JOB_CATEGORIES,
    WORK_MODE, JOB_TYPES
} from '../../constants/seekJob'


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

    // 2. Extracted your designated hook properties
    const { mutateAsync, isPending } = useUpsertJobSeekerProfile();

    const [educationList, setEducationList] = useState<any[]>([]);
    const [showAddEducationModal, setShowAddEducationModal] = useState(false);
    // Modal open/close visibility states
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);
    const [showJobTypeModal, setShowJobTypeModal] = useState(false);

    
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
            workMode: "On-site"
        });
        setImages([]);
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

        // Explicitly packing the real-time education state lists array parameter
        const profilePayload = {
            professionalHeadline: formData.professionalHeadline,
            bio: formData.bio || undefined,
            skills: parsedSkillsArray,
            experience: editingJob?.experience || [], 
            education: educationList, // Pipes live input data array to hook
            preferredJobTypes: editingJob?.preferredJobTypes || [],
            expectedSalaryMin: Number(formData.expectedSalaryMin) || 0,
            expectedSalaryCurrency: formData.expectedSalaryCurrency,
            isSearchingForJob: formData.isSearchingForJob,
            region: formData.region,
            district: formData.district,
            location: formData.location || undefined,
            workMode: formData.workMode,
            profilePictureFile: localImageFile ? {
                uri: localImageFile.uri,
                name: localImageFile.name || `profile_${Date.now()}.jpg`,
                type: localImageFile.type || 'image/jpeg'
            } : null
        };

        try {
            await mutateAsync(profilePayload);
            Alert.alert("Success 🎉", "Your candidate profile was successfully synchronized!");
            setShowModal(false);
            setEditingJob(null);
            resetForm();
            router.replace('/(tabs)/profile' as any);
        } catch (error) {
            console.error("Failed to submit job seeker profile:", error);
            Alert.alert("Update Error", "Something went wrong when trying to upload your profile updates.");
        }
    };

    const activeDistrictData = formData.region ? (GHANA_DISTRICTS_BY_REGION as any)[formData.region] || [] : [];


    return (
        <Modal visible={showModal} animationType="fade" onRequestClose={handleCloseModal}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                className="flex-1 bg-white"
            >
                {/* Header Navbar Strip */}
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                    <TouchableOpacity onPress={handleCloseModal}>
                        <Ionicons name="close" size={26} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-gray-950 font-black text-lg">
                        {editingJob ? 'Edit Candidate Profile' : 'Setup Profile'}
                    </Text>
                    <TouchableOpacity disabled={isPending} onPress={handleSubmit}>
                        {isPending ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                        ) : (
                            <Text className="text-blue-600 font-extrabold text-base">Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Form Inputs Component Canvas */}
                <SeekJobFormFields
                    formData={formData}
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
                    openCategoryPicker={() => setShowCategoryModal(true)}
                    openWorkModePicker={() => setShowWorkModeModal(true)}
                    openJobTypePicker={() => setShowJobTypeModal(true)}
                />

                {/* Dynamic Academic Records Generation Overlay Sheet Modal */}
                <Modal visible={showAddEducationModal} animationType="slide" transparent>
                    <View className="flex-1 justify-end bg-black/60">
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                            className="bg-white rounded-t-3xl p-6 max-h-[85%]"
                        >
                            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
                                <Text className="text-gray-950 font-black text-base">Add Academic Qualification</Text>
                                <TouchableOpacity onPress={() => setShowAddEducationModal(false)}>
                                    <Ionicons name="close" size={22} color="#4B5563" />
                                </TouchableOpacity>
                            </View>
                            
                           <FormInput
                                label="School / Institution Name"
                                placeholder="e.g., University of Ghana"
                                value={newEducation.schoolName}
                                onChangeText={(val) => setNewEducation(p => ({...p, schoolName: val}))}
                            />

                            <FormInput
                                label="Degree / Certification"
                                placeholder="e.g., Bachelor of Science"
                                value={newEducation.degree}
                                onChangeText={(val) => setNewEducation(p => ({...p, degree: val}))}
                            />

                            <FormInput
                                label="Field of Study / Major"
                                placeholder="e.g., Computer Science"
                                value={newEducation.fieldOfStudy}
                                onChangeText={(val) => setNewEducation(p => ({...p, fieldOfStudy: val}))}
                            />

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <FormInput
                                        label="Start Date"
                                        placeholder="YYYY-MM-DD"
                                        value={newEducation.startDate}
                                        onChangeText={(val) => setNewEducation(p => ({...p, startDate: val}))}
                                    />
                                </View>
                                {!newEducation.isCurrentEducation && (
                                    <View className="flex-1">
                                        <FormInput
                                            label="End Date"
                                            placeholder="YYYY-MM-DD"
                                            value={newEducation.endDate}
                                            onChangeText={(val) => setNewEducation(p => ({...p, endDate: val}))}
                                        />
                                    </View>
                                )}
                            </View>

                            <View className="flex-row justify-between items-center mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <Text className="text-gray-800 font-bold text-xs">Currently Studying Here</Text>
                                <Switch 
                                    value={newEducation.isCurrentEducation} 
                                    trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
                                    thumbColor={newEducation.isCurrentEducation ? "#2563EB" : "#9CA3AF"}
                                    onValueChange={(val) => setNewEducation(p => ({...p, isCurrentEducation: val, endDate: val ? "" : p.endDate}))}
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleAddEducation}
                                className="w-full bg-blue-600 py-3.5 rounded-xl items-center justify-center shadow-sm active:bg-blue-700"
                            >
                                <Text className="text-white font-extrabold text-sm">Append Qualification</Text>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Dropdown Lists Selectors Modals */}
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
                    data={activeDistrictData}
                    onSelect={(val) => handleInputChange("district", val)}
                    onClose={() => setShowDistrictModal(false)}
                />

                <FlatListPickerModal
                    visible={showCategoryModal}
                    title="Employment Sector"
                    data={JOB_CATEGORIES}
                    onSelect={(val) => handleInputChange("category", val)}
                    onClose={() => setShowCategoryModal(false)}
                />

                <FlatListPickerModal
                    visible={showWorkModeModal}
                    title="Working Arrangement"
                    data={WORK_MODE}
                    onSelect={(val) => handleInputChange("workMode", val as WorkModeType)}
                    onClose={() => setShowWorkModeModal(false)}
                />

                <FlatListPickerModal
                    visible={showJobTypeModal}
                    title="Contract Type"
                    data={JOB_TYPES}
                    onSelect={(val) => handleInputChange("jobType", val)}
                    onClose={() => setShowJobTypeModal(false)}
                />
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default SeekJobForm;

