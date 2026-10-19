import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router'; 
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import SeekJobForm from '../../components/lookForJob/SeekJobForm';

const SeekJobAdScreen = () => {
    const params = useLocalSearchParams(); 
    const [showModal, setShowModal] = useState(true); 
    const [editingSeekJob, setEditingSeekJob] = useState<any | null>(null);
    const [images, setImages] = useState<any[]>([]);


    useEffect(() => {
        if (params?.seekJobData) {
            try {
                const parsedJob = JSON.parse(params.seekJobData as string);
                setEditingSeekJob(parsedJob);
                setShowModal(true); 
            } catch (error) {
                console.error("Failed to parse job entity parameters:", error);
            }
        }
    }, [params?.seekJobData]);

    const takePhoto = async () => {
        if (images.length >= 1) {
            Alert.alert("Limit Reached", "You can only upload 1 banner image for a job posting.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need camera permissions to capture your corporate banner.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const capturedImage = {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `job_cam_${Date.now()}.jpg`,
                isRemote: false
            };
            setImages([capturedImage]);
        }
    };

    const pickImages = async () => {
        if (images.length >= 1) {
            Alert.alert("Limit Reached", "You can only upload 1 banner image for a job posting.");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need gallery permissions to upload your company image.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false, 
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const selectedImage = {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `job_img_${Date.now()}.jpg`,
                isRemote: false
            };
            
            setImages([selectedImage]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <SafeScreen>
            <Header title={editingSeekJob ? 'Edit Seek Job' : 'Seek Job'} />

            <SeekJobForm
                showModal={showModal}
                setShowModal={setShowModal}
                editingJob={editingSeekJob}
                setEditingJob={setEditingSeekJob}
                images={images}
                setImages={setImages}
                pickImages={pickImages}
                takePhoto={takePhoto} 
                removeImage={removeImage}
            />
        </SafeScreen>
    );
};

export default SeekJobAdScreen;
