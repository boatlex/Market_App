import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; 
import { useLocalSearchParams } from 'expo-router'; 
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import SeekJobForm from '../../components/lookForJob/SeekJobForm';

// Define explicit state interface matching your hook variables
export interface SelectedFileMeta {
    uri: string;
    type: string;
    name: string;
    isRemote: boolean;
}

const SeekJobAdScreen = () => {
    const params = useLocalSearchParams(); 
    const [showModal, setShowModal] = useState(true); 
    const [editingSeekJob, setEditingSeekJob] = useState<any | null>(null);
    const [images, setImages] = useState<SelectedFileMeta[]>([]);
    const [resumeFile, setResumeFile] = useState<SelectedFileMeta | null>(null); // 👈 ADDED: Resume management state hook

    useEffect(() => {
        if (params?.seekJobData) {
            try {
                const parsedJob = JSON.parse(params.seekJobData as string);
                setEditingSeekJob(parsedJob);
                setShowModal(true); 
                
                // If profile already contains a remote Cloudinary resume, initialize it
                if (parsedJob.resumeUrl) {
                    setResumeFile({
                        uri: parsedJob.resumeUrl,
                        type: 'application/pdf',
                        name: 'Attached Resume.pdf',
                        isRemote: true
                    });
                }
            } catch (error) {
                console.error("Failed to parse job entity parameters:", error);
            }
        }
    }, [params?.seekJobData]);

    const takePhoto = async () => {
        if (images.length >= 1) {
            Alert.alert("Limit Reached", "You can only upload 1 profile avatar image.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need camera permissions to capture your photo.");
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
                name: asset.fileName || `profile_cam_${Date.now()}.jpg`,
                isRemote: false
            };
            setImages([capturedImage]);
        }
    };

    const pickImages = async () => {
        if (images.length >= 1) {
            Alert.alert("Limit Reached", "You can only upload 1 profile avatar image.");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need gallery permissions to upload your profile picture.");
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
                name: asset.fileName || `profile_img_${Date.now()}.jpg`,
                isRemote: false
            };
            setImages([selectedImage]);
        }
    };

    //  Native PDF document extractor logic pipeline
    const pickResume = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const asset = result.assets[0];

            if (asset.size && asset.size > 5 * 1024 * 1024) {
                Alert.alert("File Overflow", "Please select a resume document smaller than 5MB.");
                return;
            }

            setResumeFile({
                uri: asset.uri,
                type: asset.mimeType || 'application/pdf',
                name: asset.name || `resume_${Date.now()}.pdf`,
                isRemote: false
            });
        } catch (error) {
            console.error("Failed to select resume:", error);
            Alert.alert("Selection Error", "An error occurred while fetching your document.");
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Function to clear out selected resume
    const removeResume = () => {
        setResumeFile(null);
    };

    return (
        <SafeScreen>
            <Header title={editingSeekJob ? 'Edit Profile' : 'Create Profile'} />

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
                resumeFile={resumeFile}
                pickResume={pickResume}
                removeResume={removeResume}
            />
        </SafeScreen>
    );
};

export default SeekJobAdScreen;
