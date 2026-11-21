import { View, Modal, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, ActivityIndicator, Switch, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUpsertJobSeekerProfile } from '../../hooks/useUpsertJobSeekerProfile';
import { SeekJobFormFields } from './SeekJobFormFields';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../FormInput';
import { FlatListPickerModal } from '../FlatListPickerModal';
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS,
    JOB_CATEGORIES,
    SUB_CATEGORIES_BY_CATEGORY,
    WORK_MODE,
} from '../../constants/seekJob';
import SafeScreen from '../SafeScreen';

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

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showJobTypeModal, setShowJobTypeModal] = useState(false);
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
        category: "",
        seekJobType: "",
        preferredJobTypes: [] as string[],
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
                category: editingJob.category || "",
                seekJobType: editingJob.seekJobType || "",
                preferredJobTypes: Array.isArray(editingJob.preferredJobTypes) ? editingJob.preferredJobTypes : [],
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
            category: "",
            seekJobType: "",
            preferredJobTypes: [],
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
            if (field === "category") {
                updated.seekJobType = "";
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

        if (!formData.category) {
            Alert.alert("Missing Information", "Please select a job category.");
            return;
        }

        if (!formData.seekJobType) {
            Alert.alert("Missing Information", "Please select a job subcategory.");
            return;
        }

        if (!formData.phoneNumber || !/^0\d{9}$/.test(formData.phoneNumber.trim())) {
            Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit Ghana phone number (e.g. 0241234567).");
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
                category: formData.category,
                seekJobType: formData.seekJobType,
                skills: parsedSkillsArray,
                experience: editingJob?.experience || [],
                education: educationList,
                preferredJobTypes: formData.preferredJobTypes,
                expectedSalaryMin: Number(formData.expectedSalaryMin) || 0,
                expectedSalaryCurrency: formData.expectedSalaryCurrency,
                isSearchingForJob: formData.isSearchingForJob,
                region: formData.region,
                district: formData.district,
                location: formData.location,
                phoneNumber: formData.phoneNumber.trim(),
                workMode: formData.workMode,
                profilePictureFile: localImageFile || null,
                resumeFile: localResumeFile,
            });

            Alert.alert(
                "Success",
                editingJob ? "Job seeker profile updated successfully!" : "Job seeker profile created successfully!"
            );
            handleCloseModal();
        } catch (error: any) {
            Alert.alert(
                "Error",
                error?.response?.data?.message || error?.message || "Failed to save profile."
            );
        }
    };
    const availableDistricts = formData.region
        ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
        : [];

    const availableSubCategories = formData.category
        ? SUB_CATEGORIES_BY_CATEGORY[formData.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || []
        : [];

    return (
        <Modal
            visible={showModal}
            animationType="slide"
            transparent={false}
            onRequestClose={handleCloseModal}
        >
            <SafeScreen>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 bg-white"
                >
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
                        <TouchableOpacity onPress={handleCloseModal} className="p-1.5 bg-gray-100 rounded-full">
                            <Ionicons name="close" size={22} color="#1F2937" />
                        </TouchableOpacity>
                        <Text className="text-lg font-extrabold text-gray-900">
                            {editingJob ? "Edit Job Seeker Profile" : "Create Job Seeker Profile"}
                        </Text>
                        <View className="w-8" />
                    </View>

                    <ScrollView
                        className="flex-1 px-5 pt-4"
                        contentContainerStyle={{ paddingBottom: 100 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <SeekJobFormFields
                            formData={formData}
                            setFormData={setFormData}
                            handleInputChange={handleInputChange}
                            images={images}
                            pickImages={pickImages}
                            takePhoto={takePhoto}
                            removeImage={removeImage}
                            resumeFile={resumeFile}
                            pickResume={pickResume}
                            removeResume={removeResume}
                            educationList={educationList}
                            setEducationList={setEducationList}
                            openEducationModal={() => setShowAddEducationModal(true)}
                            openCategoryPicker={() => setShowCategoryModal(true)}
                            openJobTypePicker={() => {
                                if (!formData.category) {
                                    Alert.alert("Select Category First", "Please choose a job category before selecting a subcategory.");
                                    return;
                                }
                                setShowJobTypeModal(true);
                            }}
                            openRegionPicker={() => setShowRegionModal(true)}
                            openDistrictPicker={() => {
                                if (!formData.region) {
                                    Alert.alert("Select Region First", "Please choose your region before selecting a district.");
                                    return;
                                }
                                setShowDistrictModal(true);
                            }}
                            openWorkModePicker={() => setShowWorkModeModal(true)}
                        />

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isPending}
                            activeOpacity={0.85}
                            className={`mt-6 py-4 rounded-2xl items-center justify-center shadow-sm ${
                                isPending ? "bg-blue-400" : "bg-blue-600"
                            }`}
                        >
                            {isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-bold text-base">
                                    {editingJob ? "Update Profile" : "Publish Profile"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    <FlatListPickerModal
                        visible={showCategoryModal}
                        title="Select Job Category"
                        data={JOB_CATEGORIES}
                        selectedValue={formData.category}
                        onSelect={(val) => handleInputChange("category", val)}
                        onClose={() => setShowCategoryModal(false)}
                    />

                    <FlatListPickerModal
                        visible={showJobTypeModal}
                        title="Select Subcategory / Role"
                        data={availableSubCategories}
                        selectedValue={formData.seekJobType}
                        onSelect={(val) => handleInputChange("seekJobType", val)}
                        onClose={() => setShowJobTypeModal(false)}
                    />

                    <FlatListPickerModal
                        visible={showRegionModal}
                        title="Select Region"
                        data={GHANA_REGIONS}
                        selectedValue={formData.region}
                        onSelect={(val) => handleInputChange("region", val)}
                        onClose={() => setShowRegionModal(false)}
                    />

                    <FlatListPickerModal
                        visible={showDistrictModal}
                        title="Select District"
                        data={availableDistricts}
                        selectedValue={formData.district}
                        onSelect={(val) => handleInputChange("district", val)}
                        onClose={() => setShowDistrictModal(false)}
                    />

                    <FlatListPickerModal
                        visible={showWorkModeModal}
                        title="Select Work Mode"
                        data={WORK_MODE}
                        selectedValue={formData.workMode}
                        onSelect={(val) => handleInputChange("workMode", val)}
                        onClose={() => setShowWorkModeModal(false)}
                    />

                    {showAddEducationModal && (
                        <View className="absolute inset-0 z-50 justify-end bg-black/50">
                            <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-lg font-extrabold text-gray-900">Add Education</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowAddEducationModal(false)}
                                        className="p-1 bg-gray-100 rounded-full"
                                    >
                                        <Ionicons name="close" size={20} color="#4B5563" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <FormInput
                                        label="School / Institution *"
                                        placeholder="e.g. University of Ghana"
                                        value={newEducation.schoolName}
                                        onChangeText={(text) => setNewEducation(prev => ({ ...prev, schoolName: text }))}
                                    />
                                    <FormInput
                                        label="Degree / Certificate *"
                                        placeholder="e.g. BSc Computer Science"
                                        value={newEducation.degree}
                                        onChangeText={(text) => setNewEducation(prev => ({ ...prev, degree: text }))}
                                    />
                                    <FormInput
                                        label="Field of Study"
                                        placeholder="e.g. Information Technology"
                                        value={newEducation.fieldOfStudy}
                                        onChangeText={(text) => setNewEducation(prev => ({ ...prev, fieldOfStudy: text }))}
                                    />
                                    <FormInput
                                        label="Start Date (YYYY-MM-DD) *"
                                        placeholder="e.g. 2019-09-01"
                                        value={newEducation.startDate}
                                        onChangeText={(text) => setNewEducation(prev => ({ ...prev, startDate: text }))}
                                    />

                                    <View className="flex-row items-center justify-between my-3">
                                        <Text className="text-gray-700 font-medium text-sm">Currently Studying Here</Text>
                                                                                <Switch
                                            value={newEducation.isCurrentEducation}
                                            onValueChange={(val) =>
                                                setNewEducation(prev => ({
                                                    ...prev,
                                                    isCurrentEducation: val,
                                                    endDate: val ? "" : prev.endDate
                                                }))
                                            }
                                        />
                                    </View>

                                    {!newEducation.isCurrentEducation && (
                                        <FormInput
                                            label="End Date (YYYY-MM-DD) *"
                                            placeholder="e.g. 2023-07-01"
                                            value={newEducation.endDate}
                                            onChangeText={(text) => setNewEducation(prev => ({ ...prev, endDate: text }))}
                                        />
                                    )}

                                    <TouchableOpacity
                                        onPress={handleAddEducation}
                                        activeOpacity={0.85}
                                        className="mt-4 py-3.5 bg-blue-600 rounded-xl items-center justify-center"
                                    >
                                        <Text className="text-white font-bold text-base">Save Education</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </SafeScreen>
        </Modal>
    );
};

export default SeekJobForm;