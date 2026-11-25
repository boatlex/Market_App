import {
    View,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    Keyboard,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUpdateJob } from '../../hooks/useUpdateJob';
import { useCreateJob } from '../../hooks/useCreateJob';
import { CreateJobFormFields } from '../createJob/CreateJobFormFields';
import { Ionicons } from '@expo/vector-icons';
import FlatListPickerModal from '../FlatListPickerModal';
import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS,
    JOB_CATEGORIES,
    WORK_MODE,
    JOB_TYPES,
} from '../../constants/createJobs';

type WorkModeType = typeof WORK_MODE[number];

const jobTypeOptions = Array.isArray(JOB_TYPES)
    ? JOB_TYPES.map((item: any) =>
        typeof item === 'string' ? item : item?.value || item?.label || String(item)
    )
    : [];

const workModeOptions = Array.isArray(WORK_MODE)
    ? WORK_MODE.map((item: any) =>
        typeof item === 'string' ? item : item?.value || item?.label || String(item)
    )
    : [];

interface CreateJobFormProps {
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

const CreateJobForm = ({
    showModal,
    setShowModal,
    editingJob,
    setEditingJob,
    images,
    setImages,
    pickImages,
    takePhoto,
    removeImage,
}: CreateJobFormProps) => {
    const isEditing = !!editingJob;
    const router = useRouter();

    const { createJobAsync, isCreatingJob } = useCreateJob();
    const { updateJobAsync, isUpdatingJob } = useUpdateJob();

    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);
    const [showJobTypeModal, setShowJobTypeModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

    const [formData, setFormData] = useState({
        companyName: '',
        title: '',
        description: '',
        category: '',
        jobType: '',
        workMode: 'On-site' as WorkModeType,
        currency: 'GHS',
        salaryMin: '',
        salaryMax: '',
        salaryPeriod: 'monthly',
        phoneNumber: '',
        emailForApplications: '',
        region: '',
        district: '',
        location: '',
        requirements: '',
        responsibilities: '',
        benefits: '',
        applicationDeadline: '',
    });

    useEffect(() => {
        if (editingJob) {
            setFormData({
                companyName: editingJob.companyName || '',
                title: editingJob.title || '',
                description: editingJob.description || '',
                category: editingJob.category || '',
                jobType: editingJob.jobType || '',
                workMode: editingJob.workMode || 'On-site',
                currency: editingJob.salary?.currency || 'GHS',
                salaryMin: editingJob.salary?.min ? String(editingJob.salary.min) : '',
                salaryMax: editingJob.salary?.max ? String(editingJob.salary.max) : '',
                salaryPeriod: editingJob.salary?.period || 'monthly',
                phoneNumber: editingJob.phoneNumber || '',
                emailForApplications: editingJob.emailForApplications || '',
                region: editingJob.region || '',
                district: editingJob.district || '',
                location: editingJob.location || '',
                requirements: editingJob.requirements ? editingJob.requirements.join('\n') : '',
                responsibilities: editingJob.responsibilities ? editingJob.responsibilities.join('\n') : '',
                benefits: editingJob.benefits ? editingJob.benefits.join('\n') : '',
                applicationDeadline: editingJob.applicationDeadline || '',
            });

            setImages(editingJob.jobImage ? [{ uri: editingJob.jobImage, isRemote: true }] : []);
        } else {
            resetForm();
        }
    }, [editingJob]);

    const resetForm = () => {
        setFormData({
            companyName: '',
            title: '',
            description: '',
            category: '',
            jobType: '',
            workMode: 'On-site',
            currency: 'GHS',
            salaryMin: '',
            salaryMax: '',
            salaryPeriod: 'monthly',
            phoneNumber: '',
            emailForApplications: '',
            region: '',
            district: '',
            location: '',
            requirements: '',
            responsibilities: '',
            benefits: '',
            applicationDeadline: '',
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
            router.replace('/my-jobs' as any);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            if (field === 'region') {
                updated.district = '';
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (
            !formData.companyName ||
            !formData.title ||
            !formData.description ||
            !formData.category ||
            !formData.jobType ||
            !formData.region ||
            !formData.district ||
            !formData.location
        ) {
            Alert.alert('Missing Information', 'Please fill out all mandatory fields.');
            return;
        }

        const finalPayload = {
            companyName: formData.companyName,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            jobType: formData.jobType,
            workMode: formData.workMode,
            salary: {
                currency: formData.currency,
                min: Number(formData.salaryMin) || 0,
                max: Number(formData.salaryMax) || 0,
                period: formData.salaryPeriod,
            },
            phoneNumber: formData.phoneNumber || undefined,
            emailForApplications: formData.emailForApplications || undefined,
            region: formData.region,
            district: formData.district,
            location: formData.location,
            requirements: formData.requirements
                ? formData.requirements.split('\n').filter((r) => r.trim() !== '')
                : [],
            responsibilities: formData.responsibilities
                ? formData.responsibilities.split('\n').filter((r) => r.trim() !== '')
                : [],
            benefits: formData.benefits
                ? formData.benefits.split('\n').filter((b) => b.trim() !== '')
                : [],
            applicationDeadline: formData.applicationDeadline || undefined,
        };

        try {
            if (isEditing) {
                const remoteImage = images.find((img) => img.isRemote);
                const localPick = images.find((img) => !img.isRemote);
                const selectedImage = localPick || remoteImage;

                await updateJobAsync({
                    _id: editingJob._id,
                    ...finalPayload,
                    salaryMin: Number(formData.salaryMin) || 0,
                    salaryMax: Number(formData.salaryMax) || 0,
                    currency: formData.currency,
                    salaryPeriod: formData.salaryPeriod,
                    jobImage: selectedImage
                        ? { uri: selectedImage.uri, isRemote: !!selectedImage.isRemote }
                        : undefined,
                });
            } else {
                if (images.length === 0) {
                    Alert.alert('Image Required', 'Please upload an image banner for this job posting.');
                    return;
                }
                await createJobAsync({
                    ...finalPayload,
                    jobImage: images[0],
                });
            }

            setShowModal(false);
            setEditingJob(null);
            resetForm();
            router.replace('/my-jobs' as any);
        } catch (error) {
            console.error('Failed to submit job listing:', error);
        }
    };

    const isSubmitting = isCreatingJob || isUpdatingJob;

    const availableDistricts = formData.region
        ? GHANA_DISTRICTS_BY_REGION[
        formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION
        ] || []
        : [];

    const handleOpenDistrictModal = (open: boolean) => {
        if (open && !formData.region) {
            Keyboard.dismiss();
            Alert.alert(
                'Select Region First',
                'Please choose a region before selecting a district.'
            );
            return;
        }
        Keyboard.dismiss();
        setShowDistrictModal(open);
    };

    const daysInMonth = new Date(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth() + 1,
        0
    ).getDate();
    const firstDayOfMonth = new Date(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth(),
        1
    ).getDay();

    const handleSelectCalendarDate = (day: number) => {
        const selected = new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth(),
            day
        );
        const formatted = selected.toISOString().split('T')[0];
        handleInputChange('applicationDeadline', formatted);
        setShowCalendarModal(false);
    };

    if (!showModal) return null;

    return (
        <View className="flex-1 bg-white relative">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1 bg-white"
            >
                <CreateJobFormFields
                    formData={formData}
                    handleInputChange={handleInputChange}
                    images={images}
                    pickImages={pickImages}
                    takePhoto={takePhoto}
                    removeImage={removeImage}
                    setShowCategoryModal={(show) => {
                        Keyboard.dismiss();
                        setShowCategoryModal(show);
                    }}
                    setShowJobTypeModal={(show) => {
                        Keyboard.dismiss();
                        setShowJobTypeModal(show);
                    }}
                    setShowWorkModeModal={(show) => {
                        Keyboard.dismiss();
                        setShowWorkModeModal(show);
                    }}
                    setShowRegionModal={(show) => {
                        Keyboard.dismiss();
                        setShowRegionModal(show);
                    }}
                    setShowDistrictModal={handleOpenDistrictModal}
                    setShowCalendarModal={(show) => {
                        Keyboard.dismiss();
                        setShowCalendarModal(show);
                    }}
                    handleSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    handleClose={handleCloseModal}
                />
            </KeyboardAvoidingView>

            {/* Absolute Overlay Pickers */}
            <FlatListPickerModal
                visible={showCategoryModal}
                title="Select Job Category"
                data={JOB_CATEGORIES}
                selectedValue={formData.category}
                searchable={true}
                searchPlaceholder="Search category..."
                onSelect={(val) => {
                    handleInputChange('category', val);
                    setShowCategoryModal(false);
                }}
                onClose={() => setShowCategoryModal(false)}
            />

            <FlatListPickerModal
                visible={showJobTypeModal}
                title="Select Employment Type"
                data={jobTypeOptions}
                selectedValue={formData.jobType}
                searchable={false}
                onSelect={(val) => {
                    handleInputChange('jobType', val);
                    setShowJobTypeModal(false);
                }}
                onClose={() => setShowJobTypeModal(false)}
            />

            <FlatListPickerModal
                visible={showWorkModeModal}
                title="Select Work Mode"
                data={workModeOptions}
                selectedValue={formData.workMode}
                searchable={false}
                onSelect={(val) => {
                    handleInputChange('workMode', val);
                    setShowWorkModeModal(false);
                }}
                onClose={() => setShowWorkModeModal(false)}
            />

            <FlatListPickerModal
                visible={showRegionModal}
                title="Select Region"
                data={GHANA_REGIONS}
                selectedValue={formData.region}
                searchable={true}
                searchPlaceholder="Search region..."
                onSelect={(val) => {
                    handleInputChange('region', val);
                    setShowRegionModal(false);
                }}
                onClose={() => setShowRegionModal(false)}
            />

            <FlatListPickerModal
                visible={showDistrictModal}
                title="Select District"
                data={availableDistricts}
                selectedValue={formData.district}
                searchable={true}
                searchPlaceholder="Search district or city..."
                onSelect={(val) => {
                    handleInputChange('district', val);
                    setShowDistrictModal(false);
                }}
                onClose={() => setShowDistrictModal(false)}
            />

            {/* Application Deadline Calendar Modal */}
            {showCalendarModal && (
                <Modal
                    visible={showCalendarModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowCalendarModal(false)}
                >
                    <View className="flex-1 justify-center items-center bg-black/50 px-5">
                        <View className="bg-white rounded-3xl w-full p-5 shadow-xl">
                            <View className="flex-row justify-between items-center mb-4">
                                <TouchableOpacity
                                    onPress={() =>
                                        setCurrentCalendarDate(
                                            new Date(
                                                currentCalendarDate.getFullYear(),
                                                currentCalendarDate.getMonth() - 1,
                                                1
                                            )
                                        )
                                    }
                                    className="p-2 bg-gray-100 rounded-full"
                                >
                                    <Ionicons name="chevron-back" size={18} color="#374151" />
                                </TouchableOpacity>

                                <Text className="text-base font-bold text-gray-900">
                                    {currentCalendarDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        setCurrentCalendarDate(
                                            new Date(
                                                currentCalendarDate.getFullYear(),
                                                currentCalendarDate.getMonth() + 1,
                                                1
                                            )
                                        )
                                    }
                                    className="p-2 bg-gray-100 rounded-full"
                                >
                                    <Ionicons name="chevron-forward" size={18} color="#374151" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row flex-wrap">
                                {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                                    <View key={`empty-${idx}`} className="w-[14.28%] h-10" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, idx) => {
                                    const day = idx + 1;
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            onPress={() => handleSelectCalendarDate(day)}
                                            className="w-[14.28%] h-10 items-center justify-center rounded-full active:bg-blue-100"
                                        >
                                            <Text className="text-gray-800 font-medium text-sm">
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowCalendarModal(false)}
                                className="mt-4 py-2.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-700 font-bold text-sm">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default CreateJobForm;
