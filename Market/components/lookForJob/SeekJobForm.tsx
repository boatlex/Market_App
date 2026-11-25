import {
    View,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Keyboard,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUpsertJobSeekerProfile } from '../../hooks/useUpsertJobSeekerProfile';
import { SeekJobFormFields } from './SeekJobFormFields';
import { Ionicons } from '@expo/vector-icons';
import { FlatListPickerModal } from '../FlatListPickerModal';
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS,
    JOB_CATEGORIES,
    SUB_CATEGORIES_BY_CATEGORY,
    WORK_MODE,
} from '../../constants/seekJob';
import { AddEducationModal, EducationItem } from './AddEducationModal';

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
    removeResume,
}: SeekJobFormProps) => {
    const router = useRouter();
    const { mutateAsync, isPending } = useUpsertJobSeekerProfile();

    const [educationList, setEducationList] = useState<EducationItem[]>([]);
    const [showAddEducationModal, setShowAddEducationModal] = useState(false);
    const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showJobTypeModal, setShowJobTypeModal] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);

    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const [formData, setFormData] = useState({
        professionalHeadline: '',
        bio: '',
        category: '',
        seekJobType: '',
        preferredJobTypes: [] as string[],
        skillsString: '',
        expectedSalaryMin: '',
        expectedSalaryCurrency: 'GHS',
        isSearchingForJob: true,
        region: '',
        district: '',
        location: '',
        phoneNumber: '',
        workMode: 'On-site' as WorkModeType,
    });

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
        if (editingJob) {
            setFormData({
                professionalHeadline: editingJob.professionalHeadline || '',
                bio: editingJob.bio || '',
                category: editingJob.category || '',
                seekJobType: editingJob.seekJobType || '',
                preferredJobTypes: Array.isArray(editingJob.preferredJobTypes) ? editingJob.preferredJobTypes : [],
                skillsString: editingJob.skills ? editingJob.skills.join(', ') : '',
                expectedSalaryMin: editingJob.expectedSalary?.min ? String(editingJob.expectedSalary.min) : '',
                expectedSalaryCurrency: editingJob.expectedSalary?.currency || 'GHS',
                isSearchingForJob: editingJob.isSearchingForJob !== undefined ? editingJob.isSearchingForJob : true,
                region: editingJob.region || '',
                district: editingJob.district || '',
                location: editingJob.location || '',
                phoneNumber: editingJob.phoneNumber || '',
                workMode: editingJob.workMode || 'On-site',
            });

            setEducationList(editingJob.education || []);
            setImages(editingJob.profilePicture ? [{ uri: editingJob.profilePicture, isRemote: true }] : []);
        } else {
            resetForm();
        }
    }, [editingJob]);

    const resetForm = () => {
        setFormData({
            professionalHeadline: '',
            bio: '',
            category: '',
            seekJobType: '',
            preferredJobTypes: [],
            skillsString: '',
            expectedSalaryMin: '',
            expectedSalaryCurrency: 'GHS',
            isSearchingForJob: true,
            region: '',
            district: '',
            location: '',
            phoneNumber: '',
            workMode: 'On-site',
        });
        setImages([]);
        setEducationList([]);
        setEditingEducationIndex(null);
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
        setFormData((prev) => {
            let processedValue = value;
            if (field === 'isSearchingForJob') {
                processedValue = value === true || String(value) === 'true';
            }
            const updated = { ...prev, [field]: processedValue };
            if (field === 'region') {
                updated.district = '';
            }
            if (field === 'category') {
                updated.seekJobType = '';
            }
            return updated;
        });
    };

    const handleSaveEducation = (item: EducationItem) => {
        if (editingEducationIndex !== null) {
            setEducationList((prev) =>
                prev.map((edu, idx) => (idx === editingEducationIndex ? item : edu))
            );
            setEditingEducationIndex(null);
        } else {
            setEducationList((prev) => [...prev, item]);
        }
    };

    const openEditEducation = (index: number) => {
        setEditingEducationIndex(index);
        setShowAddEducationModal(true);
    };

    const openAddEducation = () => {
        setEditingEducationIndex(null);
        setShowAddEducationModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.professionalHeadline) {
            Alert.alert('Missing Information', 'Professional headline is required.');
            return;
        }

        if (!formData.category) {
            Alert.alert('Missing Information', 'Please select a job category.');
            return;
        }

        if (!formData.seekJobType) {
            Alert.alert('Missing Information', 'Please select a job subcategory.');
            return;
        }

        if (!formData.phoneNumber || !/^0\d{9}$/.test(formData.phoneNumber.trim())) {
            Alert.alert(
                'Invalid Phone Number',
                'Please enter a valid 10-digit Ghana phone number (e.g. 0241234567).'
            );
            return;
        }

        const parsedSkillsArray = formData.skillsString
            ? formData.skillsString
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s !== '')
            : [];

        const localImageFile = images.find((img) => !img.isRemote);
        const localResumeFile = resumeFile && !resumeFile.isRemote ? resumeFile : undefined;

        const formattedEducation = educationList.map((edu) => ({
            ...edu,
            startDate:
                edu.startDate instanceof Date
                    ? edu.startDate.toISOString()
                    : String(edu.startDate || ''),
            endDate: edu.endDate
                ? edu.endDate instanceof Date
                    ? edu.endDate.toISOString()
                    : String(edu.endDate)
                : undefined,
        }));

        try {
            await mutateAsync({
                professionalHeadline: formData.professionalHeadline.trim(),
                bio: formData.bio.trim(),
                category: formData.category,
                seekJobType: formData.seekJobType,
                skills: parsedSkillsArray,
                experience: editingJob?.experience || [],
                education: formattedEducation,
                preferredJobTypes: formData.preferredJobTypes,
                expectedSalaryMin: Number(formData.expectedSalaryMin) || 0,
                expectedSalaryCurrency: formData.expectedSalaryCurrency || 'GHS',
                isSearchingForJob: formData.isSearchingForJob,
                region: formData.region,
                district: formData.district,
                location: formData.location.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                workMode: formData.workMode,
                profilePictureFile: localImageFile || null,
                resumeFile: localResumeFile || null,
            });

            handleCloseModal();
        } catch (error: any) {
            Alert.alert('Submission Failed', error?.message || 'Unable to save job seeker profile.');
        }
    };

    const availableDistricts = formData.region
        ? GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []
        : [];

    const availableSubCategories = formData.category
        ? SUB_CATEGORIES_BY_CATEGORY[formData.category as keyof typeof SUB_CATEGORIES_BY_CATEGORY] || []
        : [];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-white overflow-hidden"
            style={Platform.OS === 'web' ? { height: '100vh' as any } : undefined}
        >
            {/* Full-width ScrollView so desktop scrollbar sits flush on the right edge */}
            <ScrollView
                className="flex-1 px-5 py-4 bg-white"
                showsVerticalScrollIndicator={Platform.OS === 'web'}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{
                    paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 120,
                }}
            >
                <View className="w-full max-w-2xl self-center flex-1 pt-2">
                    {/* Inline Action Bar Header */}
                    <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-gray-100">
                        <View className="flex-1 pr-3">
                            <Text className="text-gray-900 font-extrabold text-xl">
                                {editingJob ? 'Modify Profile' : 'Profile Specifications'}
                            </Text>
                            <Text className="text-gray-400 text-xs mt-0.5 font-medium">
                                Please provide exact career & skill details
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleCloseModal}
                            activeOpacity={0.7}
                            className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center"
                        >
                            <Ionicons name="close-outline" size={16} color="#4B5563" />
                            <Text className="text-gray-600 font-semibold text-xs ml-0.5">Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
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
                        openEducationModal={openAddEducation}
                        onEditEducation={openEditEducation}
                        openCategoryPicker={() => setShowCategoryModal(true)}
                        openJobTypePicker={() => {
                            if (!formData.category) {
                                Alert.alert(
                                    'Select Category First',
                                    'Please choose a job category before selecting a subcategory.'
                                );
                                return;
                            }
                            setShowJobTypeModal(true);
                        }}
                        openRegionPicker={() => setShowRegionModal(true)}
                        openDistrictPicker={() => {
                            if (!formData.region) {
                                Alert.alert(
                                    'Select Region First',
                                    'Please choose your region before selecting a district.'
                                );
                                return;
                            }
                            setShowDistrictModal(true);
                        }}
                        openWorkModePicker={() => setShowWorkModeModal(true)}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isPending}
                        activeOpacity={0.85}
                        className={`w-full py-4 rounded-xl items-center mt-6 ${
                            isPending ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                    >
                        {isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="text-white font-bold text-base">
                                {editingJob ? 'Update Profile' : 'Publish Job Profile'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Standalone Education Modal */}
            <AddEducationModal
                visible={showAddEducationModal}
                onClose={() => {
                    setShowAddEducationModal(false);
                    setEditingEducationIndex(null);
                }}
                onSave={handleSaveEducation}
                initialData={
                    editingEducationIndex !== null ? educationList[editingEducationIndex] : null
                }
            />

            {/* Other Selection Modals */}
            {showCategoryModal && (
                <FlatListPickerModal
                    visible={showCategoryModal}
                    title="Select Job Category"
                    data={JOB_CATEGORIES}
                    selectedValue={formData.category}
                    onSelect={(val) => handleInputChange('category', val)}
                    onClose={() => setShowCategoryModal(false)}
                />
            )}

            {showJobTypeModal && (
                <FlatListPickerModal
                    visible={showJobTypeModal}
                    title="Select Subcategory / Role"
                    data={availableSubCategories}
                    selectedValue={formData.seekJobType}
                    onSelect={(val) => handleInputChange('seekJobType', val)}
                    onClose={() => setShowJobTypeModal(false)}
                />
            )}

            {showRegionModal && (
                <FlatListPickerModal
                    visible={showRegionModal}
                    title="Select Region"
                    data={GHANA_REGIONS}
                    selectedValue={formData.region}
                    onSelect={(val) => handleInputChange('region', val)}
                    onClose={() => setShowRegionModal(false)}
                />
            )}

            {showDistrictModal && (
                <FlatListPickerModal
                    visible={showDistrictModal}
                    title="Select District"
                    data={availableDistricts}
                    selectedValue={formData.district}
                    onSelect={(val) => handleInputChange('district', val)}
                    onClose={() => setShowDistrictModal(false)}
                />
            )}

            {showWorkModeModal && (
                <FlatListPickerModal
                    visible={showWorkModeModal}
                    title="Select Work Mode"
                    data={WORK_MODE}
                    selectedValue={formData.workMode}
                    onSelect={(val) => handleInputChange('workMode', val)}
                    onClose={() => setShowWorkModeModal(false)}
                />
            )}
        </KeyboardAvoidingView>
    );
};

export default SeekJobForm;