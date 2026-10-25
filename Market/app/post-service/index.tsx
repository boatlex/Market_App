import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router'; 
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import CreateServiceForm from '../../components/createService/CreateServiceForm'; 

export interface SelectedFileMeta {
    uri: string;
    type: string;
    name: string;
    isRemote: boolean;
}

const PostServiceScreen = () => {
    const params = useLocalSearchParams(); 
    const [showModal, setShowModal] = useState(true); 
    const [editingService, setEditingService] = useState<any | null>(null);
    const [portfolioImages, setPortfolioImages] = useState<SelectedFileMeta[]>([]);

    useEffect(() => {
        if (params?.serviceProviderData) {
            try {
                const parsedService = JSON.parse(params.serviceProviderData as string);
                setEditingService(parsedService);
                setShowModal(true); 
                
                // If profile already contains remote images on Cloudinary, seed them into the array
                if (parsedService.portfolioImages && parsedService.portfolioImages.length > 0) {
                    const mappedRemoteImages = parsedService.portfolioImages.map((url: string, index: number) => ({
                        uri: url,
                        type: 'image/jpeg',
                        name: `portfolio_remote_${index}.jpg`,
                        isRemote: true
                    }));
                    setPortfolioImages(mappedRemoteImages);
                }
            } catch (error) {
                console.error("Failed to parse service entity parameters:", error);
            }
        }
    }, [params?.serviceProviderData]); 

    const takePhoto = async () => {
        if (portfolioImages.length >= 5) {
            Alert.alert("Limit Reached", "You can upload a maximum of 5 portfolio pictures for your business.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need camera permissions to capture work samples.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const capturedImage = {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `portfolio_cam_${Date.now()}.jpg`,
                isRemote: false
            };
            setPortfolioImages(prev => [...prev, capturedImage]);
        }
    };

    const pickImages = async () => {
        if (portfolioImages.length >= 5) {
            Alert.alert("Limit Reached", "You can upload a maximum of 5 portfolio pictures for your business.");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need gallery permissions to upload work samples.");
            return;
        }

        const remainingSlots = 5 - portfolioImages.length;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true, 
            selectionLimit: remainingSlots,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const mappedAssets: SelectedFileMeta[] = result.assets.map((asset) => ({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `portfolio_img_${Date.now()}.jpg`,
                isRemote: false
            }));

            setPortfolioImages(prev => [...prev, ...mappedAssets].slice(0, 5));
        }
    };

    const removePortfolioImage = (indexToRemove: number) => {
        setPortfolioImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <SafeScreen>
            <Header title={editingService ? 'Edit Trade Profile' : 'Register Business'} />

            {/* Correctly wires elements down into the matching trade form layout */}
            <CreateServiceForm
                showModal={showModal}
                setShowModal={setShowModal}
                editingService={editingService}
                setEditingService={setEditingService}
                portfolioImages={portfolioImages}
                setPortfolioImages={setPortfolioImages}
                pickImages={pickImages}
                takePhoto={takePhoto} 
                removePortfolioImage={removePortfolioImage}
            />
        </SafeScreen>
    );
};

export default PostServiceScreen;
