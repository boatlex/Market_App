import { View, Modal, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useUpdateJob } from '../../hooks/useUpdateJob'
import { useCreateJob } from '../../hooks/useCreateJob'
import { CreateJobFormFields } from '../createJob/CreateJobFormFields'
import { Ionicons } from '@expo/vector-icons'

import {
    GHANA_DISTRICTS_BY_REGION,
    GHANA_REGIONS, JOB_CATEGORIES,
    WORK_MODE, JOB_TYPES
} from '../../constants/createJobs'

type WorkModeType = typeof WORK_MODE[number];

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
    removeImage
}: CreateJobFormProps) => {
    const isEditing = !!editingJob;
    const router = useRouter();

    const { createJobAsync, isCreatingJob } = useCreateJob();
    const { updateJobAsync, isUpdatingJob } = useUpdateJob();

    // Modal open/close visibility states
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWorkModeModal, setShowWorkModeModal] = useState(false);
    const [showJobTypeModal, setShowJobTypeModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());


    const [formData, setFormData] = useState({
        companyName: "",
        title: "",
        description: "",
        category: "",
        jobType: "", 
        workMode: "On-site" as WorkModeType,
        currency: "GHS",
        salaryMin: "",
        salaryMax: "",
        salaryPeriod: "monthly",
        phoneNumber: "",
        emailForApplications: "",
        region: "",
        district: "",
        location: "",
        requirements: "", 
        benefits: "",     
        applicationDeadline: ""
    });

    useEffect(() => {
        if (editingJob) {
            setFormData({
                companyName: editingJob.companyName || "",
                title: editingJob.title || "",
                description: editingJob.description || "",
                category: editingJob.category || "",
                jobType: editingJob.jobType || "",
                workMode: editingJob.workMode || "On-site",
                currency: editingJob.salary?.currency || "GHS",
                salaryMin: editingJob.salary?.min ? String(editingJob.salary.min) : "",
                salaryMax: editingJob.salary?.max ? String(editingJob.salary.max) : "",
                salaryPeriod: editingJob.salary?.period || "monthly",
                phoneNumber: editingJob.phoneNumber || "",
                emailForApplications: editingJob.emailForApplications || "",
                region: editingJob.region || "",
                district: editingJob.district || "",
                location: editingJob.location || "",
                requirements: editingJob.requirements ? editingJob.requirements.join("\n") : "",
                benefits: editingJob.benefits ? editingJob.benefits.join("\n") : "",
                applicationDeadline: editingJob.applicationDeadline || ""
            });
            
            setImages(editingJob.jobImage ? [{ uri: editingJob.jobImage, isRemote: true }] : []);
        } else {
            resetForm();
        }
    }, [editingJob]);

    const resetForm = () => {
        setFormData({
            companyName: "",
            title: "",
            description: "",
            category: "",
            jobType: "",
            workMode: "On-site",
            currency: "GHS",
            salaryMin: "",
            salaryMax: "",
            salaryPeriod: "monthly",
            phoneNumber: "",
            emailForApplications: "",
            region: "",
            district: "",
            location: "",
            requirements: "",
            benefits: "",
            applicationDeadline: ""
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
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "region") {
                updated.district = ""; 
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
            Alert.alert("Missing Information", "Please fill out all mandatory fields.");
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
                period: formData.salaryPeriod
            },
            phoneNumber: formData.phoneNumber || undefined,
            emailForApplications: formData.emailForApplications || undefined,
            region: formData.region,
            district: formData.district,
            location: formData.location,
            requirements: formData.requirements ? formData.requirements.split("\n").filter(r => r.trim() !== "") : [],
            benefits: formData.benefits ? formData.benefits.split("\n").filter(b => b.trim() !== "") : [],
            applicationDeadline: formData.applicationDeadline || undefined
        };

        try {
            if (isEditing) {
                const remoteImage = images.find(img => img.isRemote);
                const localPick = images.find(img => !img.isRemote);
                const selectedImage = localPick || remoteImage;

                await updateJobAsync({
                    _id: editingJob._id,  
                    ...finalPayload,
                    // Re-wrap property payload inside a predictable structure matching your UpdateJobVariables interface definition
                    jobImage: selectedImage ? { uri: selectedImage.uri, isRemote: !!selectedImage.isRemote } : undefined
                });
            } else {
                if (images.length === 0) {
                    Alert.alert("Image Required", "Please upload an image banner for this job posting.");
                    return;
                }
                await createJobAsync({
                    ...finalPayload,
                    jobImage: images[0]
                });
            }

            setShowModal(false);
            setEditingJob(null);
            resetForm();
            router.replace('/my-jobs' as any);

        } catch (error) {
            console.error("Failed to submit job listing:", error);
        }
    };

    const isSubmitting = isCreatingJob || isUpdatingJob;

    // Reusable FlatList Picker Modal Component
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
        onSelect: (value: string) => void; 
        onClose: () => void;
    }) => (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/40 justify-end">
                <View className="bg-white rounded-t-3xl max-h-[75%] shadow-xl">
                    <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900">{title}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
                            <Ionicons name="close" size={20} color="#4B5563" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        showsVerticalScrollIndicator={true}
                        initialNumToRender={15}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                className="px-6 py-4 border-b border-gray-50 flex-row justify-between items-center active:bg-blue-50/40"
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text className="text-base text-gray-700 font-medium">{item}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <Modal visible={showModal} animationType="slide" onRequestClose={handleCloseModal}>
            <View className="flex-1 bg-white">
                               <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1 bg-white"
                >
                    <CreateJobFormFields 
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        images={images}
                        pickImages={pickImages}
                        takePhoto={takePhoto}
                        removeImage={removeImage}
                        setShowRegionModal={setShowRegionModal}
                        setShowDistrictModal={setShowDistrictModal}
                        setShowCategoryModal={setShowCategoryModal}
                        setShowWorkModeModal={setShowWorkModeModal}
                        setShowJobTypeModal={setShowJobTypeModal}
                        setShowCalendarModal={setShowCalendarModal}
                        handleClose={handleCloseModal}
                    />
                </KeyboardAvoidingView>
            </View>

            {/* Selector Engine FlatList Modals */}
            <FlatListPickerModal 
                visible={showCategoryModal}
                title="Select Job Category"
                data={JOB_CATEGORIES}
                onClose={() => setShowCategoryModal(false)}
                onSelect={(val) => handleInputChange('category', val)}
            />

            <FlatListPickerModal 
                visible={showWorkModeModal}
                title="Select Work Arrangement"
                data={WORK_MODE}
                onClose={() => setShowWorkModeModal(false)}
                onSelect={(val) => handleInputChange('workMode', val)}
            />

            <FlatListPickerModal 
                visible={showJobTypeModal}
                title="Select Employment Type"
                data={JOB_TYPES}
                onClose={() => setShowJobTypeModal(false)}
                onSelect={(val) => handleInputChange('jobType', val)}
            />

            <FlatListPickerModal 
                visible={showRegionModal}
                title="Select Region"
                data={GHANA_REGIONS}
                onClose={() => setShowRegionModal(false)}
                onSelect={(val) => handleInputChange('region', val)}
            />

            <FlatListPickerModal 
                visible={showDistrictModal}
                title={`Districts in ${formData.region}`}
                data={GHANA_DISTRICTS_BY_REGION[formData.region as keyof typeof GHANA_DISTRICTS_BY_REGION] || []}
                onClose={() => setShowDistrictModal(false)}
                onSelect={(val) => handleInputChange('district', val)}
            />

            {/* Interactive Grid Calendar Modal Window */}
            <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
                <View className="flex-1 bg-black/50 justify-center items-center px-5">
                    <View className="bg-white rounded-3xl w-full p-5 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
                            <TouchableOpacity 
                                onPress={() => {
                                    const prevMonth = new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1));
                                    setCurrentCalendarDate(new Date(prevMonth));
                                }}
                                className="p-2 bg-gray-50 rounded-full border border-gray-100"
                            >
                                <Ionicons name="chevron-back" size={18} color="#374151" />
                            </TouchableOpacity>
                            
                            <Text className="text-base font-extrabold text-gray-900">
                                {currentCalendarDate.toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })}
                            </Text>

                            <TouchableOpacity 
                                onPress={() => {
                                    const nextMonth = new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1));
                                    setCurrentCalendarDate(new Date(nextMonth));
                                }}
                                className="p-2 bg-gray-50 rounded-full border border-gray-100"
                            >
                                <Ionicons name="chevron-forward" size={18} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-between mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                <View key={day} className="w-10 items-center">
                                    <Text className="text-xs font-bold text-gray-400 uppercase">{day}</Text>
                                </View>
                            ))}
                        </View>

                        <FlatList
                            data={(() => {
                                const year = currentCalendarDate.getFullYear();
                                const month = currentCalendarDate.getMonth();
                                const firstDayIndex = new Date(year, month, 1).getDay();
                                const totalDays = new Date(year, month + 1, 0).getDate();
                                
                                const daysArray = Array(firstDayIndex).fill(null);
                                for (let i = 1; i <= totalDays; i++) { daysArray.push(new Date(year, month, i)); }
                                return daysArray;
                            })()}
                            numColumns={7}
                            scrollEnabled={false}
                            keyExtractor={(_, index) => index.toString()}
                            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 6 }}
                            renderItem={({ item }) => {
                                if (!item) return <View className="w-10 h-10" />;
                                
                                const isPast = item < new Date(new Date().setHours(0,0,0,0));
                                const isSelected = formData.applicationDeadline && new Date(formData.applicationDeadline).toDateString() === item.toDateString();

                                return (
                                    <TouchableOpacity
                                        disabled={isPast}
                                        onPress={() => {
                                            handleInputChange("applicationDeadline", item.toISOString());
                                            setShowCalendarModal(false);
                                        }}
                                        className={`w-10 h-10 items-center justify-center rounded-xl ${
                                            isSelected ? 'bg-blue-600' : isPast ? 'bg-transparent' : 'bg-gray-50 border border-gray-100/50 active:bg-blue-50'
                                        }`}
                                    >
                                        <Text className={`text-sm font-semibold ${
                                            isSelected ? 'text-white' : isPast ? 'text-gray-300 line-through' : 'text-gray-800'
                                        }`}>
                                            {item.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <View className="flex-row space-x-2 mt-4 pt-3 border-t border-gray-100">
                            <TouchableOpacity 
                                onPress={() => { handleInputChange("applicationDeadline", ""); setShowCalendarModal(false); }}
                                className="flex-1 py-3 bg-red-50 border border-red-100 rounded-xl items-center"
                            >
                                <Text className="text-red-600 font-bold text-xs uppercase tracking-wide">Clear Date</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setShowCalendarModal(false)}
                                className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-700 font-bold text-xs uppercase tracking-wide">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

export default CreateJobForm;
