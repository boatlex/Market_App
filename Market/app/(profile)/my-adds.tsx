import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import SafeScreen from '../../components/SafeScreen';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import useListings from '../../hooks/useListings';
import { CreateListingOptionsModal } from '../../components/CreateListingOptionsModal';

const MyAddsScreen = () => {
  const router = useRouter();
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  
  const { 
    products: mixedListings, 
    isLoading, 
    isError, 
    refetch, 
    deleteProduct, 
    deletingProductId 
  } = useListings();
  
  const handleEditPress = (item: any) => {
    const isJobPosting = !!item.employer && 'isOpen' in item; 
    const isSeekingJob = 'seekerId' in item || item.listingType === 'seeking_job';
    const isService = item.category === 'Services' || item.listingType === 'service';

    let pathname = '/sell';
    let passingKey = 'productData';

    if (isJobPosting) {
      pathname = '/post-job';
      passingKey = 'jobData';
    } else if (isSeekingJob) {
      pathname = '/post-seeking-job';
      passingKey = 'seekingJobData';
    } else if (isService) {
      pathname = '/post-service';
      passingKey = 'serviceData';
    }

    router.push({
      pathname: pathname as any,
      params: { [passingKey]: JSON.stringify(item) }
    });
  };

  const handleDeletePress = (itemId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to permanently delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteProduct(itemId) 
        }
      ]
    );
  };

  const renderListingCard = ({ item }: { item: any }) => {
    const isJobPosting = !!item.employer && 'isOpen' in item;
    const isSeekingJob = 'seekerId' in item || item.listingType === 'seeking_job';
    const isService = item.category === 'Services' || item.listingType === 'service';

    const fallbackImage = "https://placehold.co";
    let displayImage = fallbackImage;

    if (isJobPosting) {
      displayImage = item.jobImage || fallbackImage;
    } else if (isSeekingJob) {
      displayImage = item.avatar || item.resumeSnapshot || fallbackImage;
    } else {
      displayImage = item.images && item.images.length > 0 ? item.images[0] : fallbackImage;
    }

    const titleText = isJobPosting || isSeekingJob ? item.title : item.name;
    const subtitleText = isJobPosting 
      ? item.companyName 
      : isSeekingJob 
        ? `${item.applicantName || 'Job Seeker'}` 
        : (isService ? "Service Provider" : "Marketplace Item");

    let financialMetric = "Negotiable";
    if (isJobPosting) {
      if (item.salary?.min && item.salary?.max) {
        financialMetric = `${item.salary.currency} ${item.salary.min.toLocaleString()} - ${item.salary.max.toLocaleString()}`;
      }
    } else if (isSeekingJob) {
      if (item.expectedSalary) {
        financialMetric = `Expected: GHS ${Number(item.expectedSalary).toLocaleString()}`;
      }
    } else if (item.price !== undefined) {
      financialMetric = `GHS ${parseFloat(item.price).toFixed(2)}`;
    }

    const isListingActive = isJobPosting ? item.isOpen : item.isAvailable;
    const statusTextLabel = isListingActive 
      ? (isJobPosting || isSeekingJob ? "Active Pipeline" : "Active Ad") 
      : (isJobPosting ? "Closed / Filled" : "Sold / Invisible");

    const isThisItemDeleting = deletingProductId === item._id;

    return (
      <View className="flex-row bg-white border border-gray-100 rounded-2xl p-3 mb-4 shadow-sm items-center">
        <Image 
          source={{ uri: displayImage }} 
          style={{ width: 80, height: 80, borderRadius: 12 }}
          contentFit="cover"
          cachePolicy="disk"
        />

        <View className="flex-1 ml-4 justify-between h-20 py-0.5">
          <View>
            <Text className="text-gray-950 font-bold text-base" numberOfLines={1}>
              {titleText}
            </Text>
            <Text className="text-gray-400 font-semibold text-xs" numberOfLines={1}>
              {subtitleText}
            </Text>
            <Text className="text-blue-600 font-black text-sm mt-0.5">
              {financialMetric}
            </Text>
          </View>
          
          <View className="flex-row items-center mt-1">
            <Ionicons 
              name={isListingActive ? "ellipse" : "ellipse-outline"} 
              size={10} 
              color={isListingActive ? "#16a34a" : "#dc2626"} 
            />
            <Text className="text-[11px] text-gray-500 font-bold ml-1">
              {statusTextLabel}
            </Text>
            
            <View className={`ml-2 px-1.5 py-0.5 rounded border ${
              isJobPosting 
                ? 'bg-purple-50 text-purple-600 border-purple-100' 
                : isSeekingJob 
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : isService 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              <Text className={`text-[9px] font-black tracking-wide ${
                isJobPosting ? 'text-purple-600' : isSeekingJob ? 'text-teal-600' : isService ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {isJobPosting ? "HIRING" : isSeekingJob ? "SEEKING JOB" : isService ? "SERVICE" : "PRODUCT"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center space-x-2 border-l border-gray-100 pl-3">
          <TouchableOpacity 
            onPress={() => handleEditPress(item)}
            disabled={isThisItemDeleting}
            className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center border border-blue-100"
          >
            <Ionicons name="create-outline" size={18} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleDeletePress(item._id)}
            disabled={isThisItemDeleting}
            className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center border border-red-100"
          >
            {isThisItemDeleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeScreen>
      <View className='px-6 pb-5 pt-3 border-b border-gray-100 flex-row items-center bg-white shadow-sm'>
        <TouchableOpacity 
          className='mr-4'
          onPress={() => router.push("/(tabs)")}
        >
          <Ionicons name='arrow-back' size={28} color={"#000"}/>
        </TouchableOpacity>
        <Text className='font-bold text-2xl text-gray-900'>My Published Ads</Text>
      </View>
      
      <View className="flex-1 px-4 pt-4 bg-gray-50/50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 text-sm font-medium mt-2">Synchronizing unified catalog...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-700 font-bold text-base mt-4">Failed to synchronize catalog</Text>
            <TouchableOpacity 
              onPress={() => refetch()}
              className="mt-3 px-5 py-2.5 bg-blue-600 rounded-xl"
            >
              <Text className="text-white font-semibold">Retry Fetch</Text>
            </TouchableOpacity>
          </View>
        ) : mixedListings?.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 text-center">
            <Ionicons name="file-tray-stacked-outline" size={54} color="#9ca3af" />
            <Text className="text-gray-800 font-bold text-lg mt-4">No active ads published</Text>
            <Text className="text-gray-500 text-sm mt-1 text-center">
              Items, services, job requests, or vacancies you host will show up here.
            </Text>
            <TouchableOpacity 
              onPress={() => setShowCreateOptions(true)}
              className="mt-5 px-6 py-3 bg-blue-600 rounded-xl shadow-sm"
            >
              <Text className="text-white font-bold text-base">Create a Listing Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={mixedListings || []}
            keyExtractor={(item) => item._id}
            renderItem={renderListingCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        )}
      </View>

      {mixedListings && mixedListings.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowCreateOptions(true)}
          activeOpacity={0.85}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-500/30 z-50"
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      <CreateListingOptionsModal 
        visible={showCreateOptions}
        onClose={() => setShowCreateOptions(false)}
      />
    </SafeScreen>
  );
};

export default MyAddsScreen;












// import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// import React from 'react';
// import SafeScreen from '../../components/SafeScreen';
// import Header from '../../components/Header';
// import { useRouter } from 'expo-router';
// import { useAuth } from '../../contexts/authContext'; 
// import { Ionicons } from '@expo/vector-icons';
// import useListings from '../../hooks/useListings';

// const MyAddsScreen = () => {
//   const router = useRouter();
//     const { 
//     products, 
//     isLoading, 
//     isError, 
//     refetch, 
//     deleteProduct, 
//     deletingProductId 
//   } = useListings();
  
//   const handleEditPress = (product: any) => {
//     router.push({
//       pathname: '/sell',
//       params: { productData: JSON.stringify(product) }
//     });
//   };

//   const handleDeletePress = (productId: string) => {
//     Alert.alert(
//       "Confirm Deletion",
//       "Are you sure you want to permanently delete this listing? This action cannot be undone.",
//       [
//         {
//           text: "Cancel",
//           style: "cancel" 
//         },
//         {
//           text: "Delete",
//           style: "destructive", 
//           onPress: () => deleteProduct(productId) 
//         }
//       ]
//     );
//   };

//   const renderProductCard = ({ item }: { item: any }) => {
//     const fallbackImage = "https://placeholder.com";
//     const primaryImage = item.images && item.images.length > 0 ? item.images[0] : fallbackImage;

//     // FIXED: Isolate loading state strictly to this specific card instance
//     const isThisItemDeleting = deletingProductId === item._id;

//     return (
//       <View className="flex-row bg-white border border-gray-100 rounded-2xl p-3 mb-4 shadow-sm items-center">
//         <Image 
//           source={{ uri: primaryImage }} 
//           className="w-20 h-20 rounded-xl bg-gray-100 object-cover"
//         />

//         {/* Product Details info panel */}
//         <View className="flex-1 ml-4 justify-between">
//           <View>
//             {/* FIXED: Removed numberOfLines out of the className template string */}
//             <Text className="text-black font-bold text-base" numberOfLines={1}>
//               {item.name}
//             </Text>
//             <Text className="text-blue-600 font-extrabold text-sm mt-1">
//               GHS {parseFloat(item.price).toFixed(2)}
//             </Text>
//           </View>
          
//           <View className="flex-row items-center mt-2">
//             <Ionicons 
//               name={item.isAvailable ? "ellipse" : "ellipse-outline"} 
//               size={10} 
//               color={item.isAvailable ? "#16a34a" : "#dc2626"} 
//             />
//             <Text className="text-[11px] text-gray-500 font-medium ml-1">
//               {item.isAvailable ? "Active Ad" : "Sold / Invisible"}
//             </Text>
//           </View>
//         </View>

//         {/* Interactive Actions Controls Wrapper */}
//         <View className="flex-row space-x-2 border-l border-gray-100 pl-3">
//           {/* Edit Button */}
//           <TouchableOpacity 
//             onPress={() => handleEditPress(item)}
//             disabled={isThisItemDeleting}
//             className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center border border-blue-100"
//           >
//             <Ionicons name="create-outline" size={18} color="#2563eb" />
//           </TouchableOpacity>

//           {/* Delete Button */}
//           <TouchableOpacity 
//             onPress={() => handleDeletePress(item._id)}
//             disabled={isThisItemDeleting}
//             className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center border border-red-100"
//           >
//             {isThisItemDeleting ? (
//               <ActivityIndicator size="small" color="#dc2626" />
//             ) : (
//               <Ionicons name="trash-outline" size={18} color="#dc2626" />
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeScreen>
//       <View className='px-6 pb-5 pt-3 border-b border-surface flex-row items-center'>
//         <TouchableOpacity 
//           className='mr-4'
//           onPress={() => router.push("/(tabs)")}
//         >
//           <Ionicons name='arrow-back' size={28} color={"#000"}/>
//         </TouchableOpacity>
//         <Text className='font-bold text-2xl'>My-Ads</Text>
//       </View>
      
//       <View className="flex-1 px-4 pt-4 bg-gray-50/50">
//         {isLoading ? (
//           <View className="flex-1 items-center justify-center">
//             <ActivityIndicator size="large" color="#2563eb" />
//             <Text className="text-gray-500 text-sm font-medium mt-2">Loading your ads...</Text>
//           </View>
//         ) : isError ? (
//           <View className="flex-1 items-center justify-center px-6 text-center">
//             <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
//             <Text className="text-gray-700 font-bold text-base mt-4">Failed to synchronize catalog</Text>
//             <TouchableOpacity 
//               onPress={() => refetch()}
//               className="mt-3 px-4 py-2 bg-blue-600 rounded-lg"
//             >
//               <Text className="text-white font-semibold">Retry Fetch</Text>
//             </TouchableOpacity>
//           </View>
//         ) : products?.length === 0 ? (
//           <View className="flex-1 items-center justify-center px-6 text-center">
//             <Ionicons name="file-tray-stacked-outline" size={54} color="#9ca3af" />
//             <Text className="text-gray-800 font-bold text-lg mt-4">No active ads published</Text>
//             <Text className="text-gray-500 text-sm mt-1">Items you publish for sale will show up right here.</Text>
//             <TouchableOpacity 
//               onPress={() => router.push('/sell')}
//               className="mt-5 px-6 py-3 bg-blue-600 rounded-xl shadow-sm"
//             >
//               <Text className="text-white font-bold text-base">Create an Ad Now</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <FlatList
//             data={products || []}
//             keyExtractor={(item) => item._id}
//             renderItem={renderProductCard}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={{ paddingBottom: 40 }}
//             refreshing={isLoading}
//             onRefresh={refetch}
//           />
//         )}
//       </View>
//     </SafeScreen>
//   );
// };

// export default MyAddsScreen;
