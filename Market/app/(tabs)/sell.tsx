import React, { useState } from 'react';
import { Button, View, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SafeScreen from '../../components/SafeScreen';
import CreateProductForm from '../../components/CreateProductForm';
import Header from '../../components/Header';

const SellScreen = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [images, setImages] = useState<any[]>([]);

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need camera roll permissions to upload product media.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
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
           
            {/* Header */}
            <Header title='Sell/Post Product'/>
            <CreateProductForm
                showModal={showModal}
                setShowModal={setShowModal}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                images={images}
                setImages={setImages}
                pickImages={pickImages}
                removeImage={removeImage}
            />
        </SafeScreen>
    );
};

export default SellScreen;
