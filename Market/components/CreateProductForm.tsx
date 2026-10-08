import { View, Text, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, TextInput, Image, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
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
        <View className='flex-1 bg-white'>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className='flex-1 bg-white'
            >
                {/* Scrollable Form Body Container */}
                <ScrollView
                    className='flex-1 px-5 py-4 bg-white'
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                >
                    <View className='space-y-4 auto-cols-max pb-20'>

                        {/* Media Picker Section */}
                        <View>
                            <Text className='text-black text-sm font-semibold mb-2'>
                                Product Photos ({images.length})
                            </Text>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="flex-row">
                                <TouchableOpacity
                                    onPress={pickImages}
                                    className='w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-200 mr-3'
                                >
                                    <Ionicons name="camera" size={26} color="#888" />
                                    <Text className='text-[10px] text-gray-500 mt-1 font-medium'>Add Photo</Text>
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
                            <Text className='text-black text-sm font-semibold mb-1'>Product Name</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
                                placeholder="Enter item name..."
                                placeholderTextColor="#888"
                                value={formData.name}
                                onChangeText={(val) => handleInputChange("name", val)}
                            />
                        </View>

                        {/* Price Input */}
                        <View>
                            <Text className='text-black text-sm font-semibold mb-1'>Price (GHS)</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
                                placeholder="0.00"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                value={formData.price}
                                onChangeText={(val) => handleInputChange("price", val)}
                            />
                        </View>

                        {/* Phone Number Input */}
                        <View>
                            <Text className='text-sm font-semibold mb-1'>Contact Number</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
                                placeholder="e.g. +233..."
                                placeholderTextColor="#888"
                                keyboardType="phone-pad"
                                value={formData.phoneNumber}
                                onChangeText={(val) => handleInputChange("phoneNumber", val)}
                            />
                        </View>

                        {/* Category Input */}
                        <View>
                            <Text className='text-sm font-semibold mb-1'>Category</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
                                placeholder="e.g. Electronics, Fashion..."
                                placeholderTextColor="#888"
                                value={formData.category}
                                onChangeText={(val) => handleInputChange("category", val)}
                            />
                        </View>

                        {/* Product Type Input */}
                        <View>
                            <Text className='text-sm font-semibold mb-1'>Product Type</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
                                placeholder="e.g. Physical, Digital..."
                                placeholderTextColor="#888"
                                value={formData.productType}
                                onChangeText={(val) => handleInputChange("productType", val)}
                            />
                        </View>

                        {/* Region Dropdown Field Selector */}
                        <View>
                            <Text className='text-sm font-semibold mb-1'>Region</Text>
                            <TouchableOpacity
                                onPress={() => setShowRegionModal(true)}
                                className='border border-gray-300 rounded-lg p-3 bg-gray-100 flex-row items-center justify-between'
                            >
                                <Text className={formData.region ? 'text-black' : 'text-gray-400'}>
                                    {formData.region || "Select Region..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {/* Specific Location Input */}
                        <View>
                            <Text className='text-black text-sm font-semibold mb-1'>Specific Location</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
                                placeholder="e.g. East Legon..."
                                placeholderTextColor="#888"
                                value={formData.location}
                                onChangeText={(val) => handleInputChange("location", val)}
                            />
                        </View>

                        {/* Description Input */}
                        <View>
                            <Text className='text-black text-sm font-semibold mb-1'>Description</Text>
                            <TextInput
                                className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100 h-24'
                                placeholder="Describe your product details..."
                                placeholderTextColor="#888"
                                multiline={true}
                                textAlignVertical="top"
                                value={formData.description}
                                onChangeText={(val) => handleInputChange("description", val)}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* FIXED STICKY ACTION BUTTON PANEL */}
                <View className='p-3 bg-white border-t border-gray-200 mb-36' >
                    <TouchableOpacity 
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        className={`p-6 m-8 rounded-xl items-center justify-center ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'}`}
                    >
                        <Text className='text-white font-bold text-xl'>
                            {isSubmitting ? "Processing..." : isEditing ? "Save Changes" : "Submit Listing"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Region Selection Dropdown Modal */}
            <Modal visible={showRegionModal} animationType="fade" transparent={true}>
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full max-h-[70%] rounded-2xl p-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-black">Select Region</Text>
                            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={GHANA_REGIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    className="py-3 border-b border-gray-100"
                                    onPress={() => {
                                        handleInputChange("region", item);
                                        setShowRegionModal(false);
                                    }}
                                >
                                    <Text className="text-base text-gray-800">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CreateProductForm;






// import { View, Text, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, TextInput, Image, FlatList } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import SafeScreen from './SafeScreen'
// import { Ionicons } from '@expo/vector-icons'
// import { useUpdateProduct } from '../hooks/useUpdateProduct'
// import { useCreateProduct } from '../hooks/usecreateProduct'

// const GHANA_REGIONS = [
//     "Greater Accra", "Ashanti", "Bono", "Bono East", "Central", "Eastern",
//     "Ahafo", "Northern", "Oti", "Savannah", "North East",
//     "Upper East", "Upper West", "Volta", "Western", "Western North"
// ];

// interface CreateProductFormProps {
//     showModal: boolean;
//     setShowModal: (show: boolean) => void;
//     editingProduct: any | null;
//     setEditingProduct: (product: any | null) => void;
//     images: any[];
//     setImages: (images: any[]) => void;
//     pickImages: () => Promise<void>;
//     removeImage: (index: number) => void;
// }

// const CreateProductForm = ({
//     showModal,
//     setShowModal,
//     editingProduct,
//     setEditingProduct,
//     images,
//     setImages,
//     pickImages,
//     removeImage
// }: CreateProductFormProps) => {
//     const isEditing = !!editingProduct;

//     // Hooks
//     const { createProductAsync, isCreatingProduct } = useCreateProduct();
//     const { updateProductAsync, isUpdatingProduct } = useUpdateProduct();

//     const [showRegionModal, setShowRegionModal] = useState(false);
//     const [formData, setFormData] = useState({
//         name: "",
//         description: "",
//         price: "",
//         phoneNumber: "",
//         category: "",
//         productType: "",
//         region: "",
//         location: "",
//     });

//     // Automatically fill the fields if editing an existing listing
//     useEffect(() => {
//         if (editingProduct) {
//             setFormData({
//                 name: editingProduct.name || "",
//                 description: editingProduct.description || "",
//                 price: String(editingProduct.price || ""),
//                 phoneNumber: editingProduct.phoneNumber || "",
//                 category: editingProduct.category || "",
//                 productType: editingProduct.productType || "",
//                 region: editingProduct.region || "",
//                 location: editingProduct.location || "",
//             });
//             setImages(editingProduct.images ? editingProduct.images.map((img: string) => ({ uri: img, isRemote: true })) : []);
//         } else {
//             resetForm();
//         }
//     }, [editingProduct]);

//     const resetForm = () => {
//         setFormData({
//             name: "",
//             description: "",
//             price: "",
//             phoneNumber: "",
//             category: "",
//             productType: "",
//             region: "",
//             location: "",
//         });
//         setImages([]);
//     };

//     const handleCloseModal = () => {
//         setShowModal(false);
//         setEditingProduct(null);
//         resetForm();
//     };

//     const handleInputChange = (field: string, value: string) => {
//         setFormData(prev => ({ ...prev, [field]: value }));
//     };

//     const handleSubmit = async () => {
//         try {
//             if (isEditing) {
//                 const localPicksOnly = images.filter(img => !img.isRemote);
//                 await updateProductAsync({
//                     productId: editingProduct._id,
//                     ...formData,
//                     images: localPicksOnly
//                 });
//             } else {
//                 await createProductAsync({
//                     ...formData,
//                     images: images
//                 });
//             }
//             handleCloseModal();
//         } catch (error) {
//             console.error("Failed to submit product request:", error);
//         }
//     };

//     const isSubmitting = isCreatingProduct || isUpdatingProduct;

//     return (

//         <View className='flex-1 gap-5' mb-20>
//             <KeyboardAvoidingView
//                 behavior={Platform.OS === "ios" ? "padding" : "height"}
//                 className='flex-1 bg-white'
//             >
//                 {/* Header */}
//                 <View className='px-5 py-5 border-b border-gray-200 items-center bg-white'>
//                     <Text className='text-black text-2xl font-bold'>
//                         {isEditing ? "Edit Product" : "List New Product"}
//                     </Text>
//                 </View>

//                 {/* Scrollable Form Body Container */}
//                 <ScrollView
//                     className='flex-1 px-5 py-4 bg-white'
//                     keyboardShouldPersistTaps='handled'
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={{ paddingBottom: 40 }}
//                 >
//                     <View className='space-y-4 pb-10'>

//                         {/* Media Picker Section */}
//                         <View>
//                             <Text className='text-black text-sm font-semibold mb-2'>
//                                 Product Photos ({images.length})
//                             </Text>
//                             {/* FIX: Added horizontal display for images */}
//                             <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="flex-row">
//                                 <TouchableOpacity
//                                     onPress={pickImages}
//                                     className='w-20 h-20 border border-gray-300 rounded-xl items-center justify-center bg-gray-200 mr-3'
//                                 >
//                                     <Ionicons name="camera" size={26} color="#888" />
//                                     <Text className='text-[10px] text-gray-500 mt-1 font-medium'>Add Photo</Text>
//                                 </TouchableOpacity>

//                                 {images.map((img, index) => (
//                                     <View key={index} className='w-20 h-20 mr-3 relative rounded-xl overflow-hidden bg-gray-100'>
//                                         <Image source={{ uri: img.uri }} className='w-full h-full object-cover' />
//                                         <TouchableOpacity
//                                             onPress={() => removeImage(index)}
//                                             className='absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center'
//                                         >
//                                             <Ionicons name="close-circle" size={16} color="#FFF" />
//                                         </TouchableOpacity>
//                                     </View>
//                                 ))}
//                             </ScrollView>
//                         </View>

//                         {/* Product Name Input */}
//                         <View>
//                             <Text className='text-black text-sm font-semibold mb-1'>Product Name</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
//                                 placeholder="Enter item name..."
//                                 placeholderTextColor="#888"
//                                 value={formData.name}
//                                 onChangeText={(val) => handleInputChange("name", val)}
//                             />
//                         </View>

//                         {/* Price Input */}
//                         <View>
//                             <Text className='text-black text-sm font-semibold mb-1'>Price (GHS)</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
//                                 placeholder="0.00"
//                                 placeholderTextColor="#888"
//                                 keyboardType="numeric"
//                                 value={formData.price}
//                                 onChangeText={(val) => handleInputChange("price", val)}
//                             />
//                         </View>

//                         {/* Phone Number Input */}
//                         <View>
//                             <Text className='text-sm font-semibold mb-1'>Contact Number</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 bg-gray-100'
//                                 placeholder="e.g. +233..."
//                                 placeholderTextColor="#888"
//                                 keyboardType="phone-pad"
//                                 value={formData.phoneNumber}
//                                 onChangeText={(val) => handleInputChange("phoneNumber", val)}
//                             />
//                         </View>

//                         {/* Category Input */}
//                         <View>
//                             <Text className='text-sm font-semibold mb-1'>Category</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 bg-gray-100'
//                                 placeholder="e.g. Electronics, Fashion..."
//                                 placeholderTextColor="#888"
//                                 value={formData.category}
//                                 onChangeText={(val) => handleInputChange("category", val)}
//                             />
//                         </View>

//                         {/* Product Type Input */}
//                         <View>
//                             <Text className='text-sm font-semibold mb-1'>Product Type</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 bg-gray-100'
//                                 placeholder="e.g. Physical, Digital..."
//                                 placeholderTextColor="#888"
//                                 value={formData.productType}
//                                 onChangeText={(val) => handleInputChange("productType", val)}
//                             />
//                         </View>

//                         {/* Region Dropdown Field Selector */}
//                         <View>
//                             <Text className='text-sm font-semibold mb-1'>Region</Text>
//                             <TouchableOpacity
//                                 onPress={() => setShowRegionModal(true)}
//                                 className='border border-gray-300 rounded-lg p-3 bg-gray-100 flex-row items-center justify-between'
//                             >
//                                 <Text className={formData.region ? 'text-black' : 'text-gray-400'}>
//                                     {formData.region || "Select Region..."}
//                                 </Text>
//                                 <Ionicons name="chevron-down" size={20} color="#888" />
//                             </TouchableOpacity>
//                         </View>

//                         {/* Specific Location Input */}
//                         <View>
//                             <Text className='text-black text-sm font-semibold mb-1'>Specific Location</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100'
//                                 placeholder="e.g. East Legon..."
//                                 placeholderTextColor="#888"
//                                 value={formData.location}
//                                 onChangeText={(val) => handleInputChange("location", val)}
//                             />
//                         </View>

//                         {/* Description Input */}
//                         <View>
//                             <Text className='text-black text-sm font-semibold mb-1'>Description</Text>
//                             <TextInput
//                                 className='border border-gray-300 rounded-lg p-3 text-black bg-gray-100 h-24 textAlignVertical-top'
//                                 placeholder="Describe your product details..."
//                                 placeholderTextColor="#888"
//                                 multiline={true}
//                                 value={formData.description}
//                                 onChangeText={(val) => handleInputChange("description", val)}
//                             />
//                         </View>
//                     </View>
//                 </ScrollView>

//                 {/* Submit Btn */}
//                 <View className='p-5 bg-white border-t border-gray-200 pb-8'>
//                     <TouchableOpacity
//                         onPress={handleSubmit}
//                         disabled={isSubmitting}
//                         className={`p-4 rounded-xl items-center justify-center ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'}`}
//                     >
//                         <Text className='text-white font-bold text-lg'>
//                             {isSubmitting ? "Processing..." : isEditing ? "Save Changes" : "Submit Listing"}
//                         </Text>
//                     </TouchableOpacity>
//                 </View>
//             </KeyboardAvoidingView>



//             {/* Inner Dropdown Sheet for Region List Selection */}
//             <Modal
//                 visible={showRegionModal}
//                 animationType="slide"
//                 transparent={true}
//                 onRequestClose={() => setShowRegionModal(false)}
//             >
//                 <View style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} className="flex-1 justify-center items-center px-6">
//                     <View className="w-full max-h-[70%] bg-background border border-surface rounded-2xl overflow-hidden shadow-2xl">
//                         <View className="p-4 border-b border-surface flex-row justify-between items-center bg-surface">
//                             <Text className="text-text-primary font-bold text-lg">Select Ghana Region</Text>
//                             <TouchableOpacity onPress={() => setShowRegionModal(false)}>
//                                 <Ionicons name="close" size={24} color="#FFF" />
//                             </TouchableOpacity>
//                         </View>

//                         <FlatList
//                             data={GHANA_REGIONS}
//                             keyExtractor={(item) => item}
//                             renderItem={({ item }) => (
//                                 <TouchableOpacity
//                                     className={`p-4 border-b border-surface/30 flex-row items-center justify-between ${formData.region === item ? 'bg-primary/10' : ''}`}
//                                     onPress={() => {
//                                         handleInputChange("region", item);
//                                         setShowRegionModal(false);
//                                     }}
//                                 >
//                                     <Text className="text-text-primary text-base font-medium">{item}</Text>
//                                     {formData.region === item && <Ionicons name="checkmark-circle" size={20} color="#0000ff" />}
//                                 </TouchableOpacity>
//                             )}
//                         />
//                     </View>
//                 </View>
//             </Modal>
//         </View>
//     )
// }

// export default CreateProductForm;
