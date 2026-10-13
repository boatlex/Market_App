import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router'; 
import SafeScreen from '../../components/SafeScreen';
import CreateProductForm from '../../components/CreateProductForm';
import Header from '../../components/Header';

const SellScreen = () => {
    const params = useLocalSearchParams(); 
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [images, setImages] = useState<any[]>([]);

    useEffect(() => {
        if (params?.productData) {
            try {
                const parsedProduct = JSON.parse(params.productData as string);
                setEditingProduct(parsedProduct);
                setShowModal(true); 
            } catch (error) {
                console.error("Failed to parse product parameters:", error);
            }
        }
    }, [params?.productData]);

    const takePhoto = async () => {
        const remainingSlots = 3 - images.length;
        if (remainingSlots <= 0) {
            Alert.alert("Limit Reached", "You can only upload a maximum of 3 images.");
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need camera permissions to snap a picture of your product.");
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
                name: asset.fileName || `cam_${Date.now()}.jpg`
            };
            setImages(prev => [...prev, capturedImage]);
        }
    };

    const pickImages = async () => {
        const remainingSlots = 3 - images.length;
        if (remainingSlots <= 0) {
            Alert.alert("Limit Reached", "You can only upload a maximum of 3 images.");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need camera roll permissions to upload product media.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remainingSlots,
            quality: 0.8,
        });

        if (!result.canceled) {
            const selectedImages = result.assets.map(asset => ({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `img_${Date.now()}.jpg`
            }));
            
            setImages(prev => [...prev, ...selectedImages]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <SafeScreen>
            <Header title={editingProduct ? 'Edit Product' : 'Sell/Post Product'} />

            <CreateProductForm
                showModal={showModal}
                setShowModal={setShowModal}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                images={images}
                setImages={setImages}
                pickImages={pickImages}
                takePhoto={takePhoto} 
                removeImage={removeImage}
            />
        </SafeScreen>
    );
};

export default SellScreen;
