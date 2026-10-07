import { View, Text, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, TextInput, Image, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeScreen from './SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { useUpdateProduct } from '../hooks/useUpdateProduct'
import { useCreateProduct } from '../hooks/usecreateProduct'

const GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Bono", "Bono East", "Central", "Eastern", 
    "Ahafo", "Northern", "Oti", "Savannah", "North East", 
    "Upper East", "Upper West", "Volta", "Western", "Western North"
];

interface CreateProductFormProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingProduct: any | null; 
    setEditingProduct: (product: any | null) => void;
    images: any[];
    setImages: (images: any[]) => void;
    pickImages: () => Promise<void>;
    removeImage: (index: number) => void;
}

const CreateProductForm = ({ 
    showModal, 
    setShowModal, 
    editingProduct, 
    setEditingProduct,
    images,
    setImages,
    pickImages,
    removeImage 
}: CreateProductFormProps) => {
    const isEditing = !!editingProduct;
    
    // Hooks
    const { createProductAsync, isCreatingProduct } = useCreateProduct();
    const { updateProductAsync, isUpdatingProduct } = useUpdateProduct();

    const [showRegionModal, setShowRegionModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        phoneNumber: "",
        category: "",
        productType: "",
        region: "",
        location: "",
    });

    // Automatically fill the fields if editing an existing listing
    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name || "",
                description: editingProduct.description || "",
                price: String(editingProduct.price || ""),
                phoneNumber: editingProduct.phoneNumber || "",
                category: editingProduct.category || "",
                productType: editingProduct.productType || "",
                region: editingProduct.region || "",
                location: editingProduct.location || "",
            });
            setImages(editingProduct.images ? editingProduct.images.map((img: string) => ({ uri: img, isRemote: true })) : []);
        } else {
            resetForm();
        }
    }, [editingProduct]);

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            price: "",
            phoneNumber: "",
            category: "",
            productType: "",
            region: "",
            location: "",
        });
        setImages([]);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null); 
        resetForm();
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            if (isEditing) {
                const localPicksOnly = images.filter(img => !img.isRemote);
                await updateProductAsync({
                    productId: editingProduct._id,
                    ...formData,
                    images: localPicksOnly 
                });
            } else {
                await createProductAsync({
                    ...formData,
                    images: images
                });
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to submit product request:", error);
        }
    };

    const isSubmitting = isCreatingProduct || isUpdatingProduct;

    return (
        <Modal
            visible={showModal}
            animationType='slide'
            transparent
            onRequestClose={handleCloseModal}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className='flex-1 bg-background'
            >
                <SafeScreen>
                    {/* Header */}
                    <View className='px-5 py-5 border-b border-surface flex-row items-center justify-between'>
                        <Text className='text-text-primary text-2xl font-bold'>
                            {isEditing ? "Edit Product" : "List New Product"}
                        </Text>
                        <TouchableOpacity onPress={handleCloseModal}>
                            <Ionicons name='close' size={28} color={"#FFFFFF"} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Form Body Container */}
                    <ScrollView className='flex-1 px-5 py-4 text-text-primary' keyboardShouldPersistTaps='handled'>
                        <View className='space-y-4 pb-10 '>
                            
                            {/* Media Picker Section */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-2'>Product Photos ({images.length})</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className='flex-row mb-2'>
                                    <TouchableOpacity 
                                        onPress={pickImages}
                                        className='w-20 h-20 border-2 border-dashed border-surface rounded-xl items-center justify-center bg-surface mr-3'
                                    >
                                        <Ionicons name="camera" size={26} color="#888" />
                                        <Text className='text-[10px] text-text-secondary mt-1 font-medium'>Add Photo</Text>
                                    </TouchableOpacity>

                                    {images.map((img, index) => (
                                        <View key={index} className='w-20 h-20 mr-3 relative rounded-xl overflow-hidden bg-gray-100'>
                                            <Image source={{ uri: img.uri }} className='w-full h-full object-cover' />
                                            <TouchableOpacity 
                                                onPress={() => removeImage(index)}
                                                className='absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center'
                                            >
                                                <Ionicons name="close-circle" size={16} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Product Name Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Product Name</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100'
                                    placeholder="Enter item name..."
                                    placeholderTextColor="#888"
                                    value={formData.name}
                                    onChangeText={(val) => handleInputChange("name", val)}
                                />
                            </View>

                            {/* Price Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Price (GHS)</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100'
                                    placeholder="0.00"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={formData.price}
                                    onChangeText={(val) => handleInputChange("price", val)}
                                />
                            </View>

                            {/* Phone Number Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Contact Number</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100'
                                    placeholder="e.g. +233..."
                                    placeholderTextColor="#888"
                                    keyboardType="phone-pad"
                                    value={formData.phoneNumber}
                                    onChangeText={(val) => handleInputChange("phoneNumber", val)}
                                />
                            </View>

                            {/* Category Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Category</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100'
                                    placeholder="e.g. Electronics, Fashion..."
                                    placeholderTextColor="#888"
                                    value={formData.category}
                                    onChangeText={(val) => handleInputChange("category", val)}
                                />
                            </View>

                            {/* Product Type Input */}
                            {/* Product Type Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Product Type</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100'
                                    placeholder="e.g. Physical, Digital..."
                                    placeholderTextColor="#888"
                                    value={formData.productType}
                                    onChangeText={(val) => handleInputChange("productType", val)}
                                />
                            </View>

                            {/* Region Dropdown Field Selector */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Region</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowRegionModal(true)}
                                    className='border border-surface rounded-lg p-3 bg-gray-100 flex-row items-center justify-between'
                                >
                                    <Text className={formData.region ? 'text-text-primary' : 'text-gray-400'}>
                                        {formData.region || "Select Region..."}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#888" />
                                </TouchableOpacity>
                            </View>

                            {/* Specific Location Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Specific Location</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100'
                                    placeholder="e.g. East Legon..."
                                    placeholderTextColor="#888"
                                    value={formData.location}
                                    onChangeText={(val) => handleInputChange("location", val)}
                                />
                            </View>

                            {/* Description Input */}
                            <View>
                                <Text className='text-text-secondary text-sm font-semibold mb-1'>Description</Text>
                                <TextInput
                                    className='border border-surface rounded-lg p-3 text-text-primary bg-gray-100 h-24'
                                    placeholder="Describe item condition, availability..."
                                    placeholderTextColor="#888"
                                    multiline
                                    textAlignVertical="top"
                                    value={formData.description}
                                    onChangeText={(val) => handleInputChange("description", val)}
                                />
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity 
                                className={`w-full py-4 rounded-xl items-center mt-6 ${isSubmitting ? 'bg-surface-variant' : 'bg-primary'}`}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                <Text className='text-white text-base font-bold'>
                                    {isSubmitting ? "Uploading assets..." : isEditing ? "Save Edits" : "Post Product"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeScreen>
            </KeyboardAvoidingView>

            {/* Inner Dropdown Sheet for Region List Selection */}
            <Modal
                visible={showRegionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRegionModal(false)}
            >
                <View style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} className="flex-1 justify-center items-center px-6">
                    <View className="w-full max-h-[70%] bg-background border border-surface rounded-2xl overflow-hidden shadow-2xl">
                        <View className="p-4 border-b border-surface flex-row justify-between items-center bg-surface">
                            <Text className="text-text-primary font-bold text-lg">Select Ghana Region</Text>
                            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={GHANA_REGIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className={`p-4 border-b border-surface/30 flex-row items-center justify-between ${formData.region === item ? 'bg-primary/10' : ''}`}
                                    onPress={() => {
                                        handleInputChange("region", item);
                                        setShowRegionModal(false);
                                    }}
                                >
                                    <Text className="text-text-primary text-base font-medium">{item}</Text>
                                    {formData.region === item && <Ionicons name="checkmark-circle" size={20} color="#0000ff" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </Modal>
    )
}

export default CreateProductForm;
