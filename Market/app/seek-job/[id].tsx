import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking } from 'react-native';
import React, { useState, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetJobSeekerById } from '../../hooks/useGetJobSeekerById';
import ErrorUi from '../../components/ErrorUi';
import LoadingUi from '../../components/LoadingUi';
import SafeScreen from '../../components/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ImageView from '../../components/CrossPlatformImageView.native';
import { useAuth } from '../../contexts/authContext';
import { useReportModalStore } from '../../stores/useReportModalStore';
import ItemReviewsSection from '../../components/reviews/ItemsReviewsSection';
import RelatedJobSeekerCard from '../../components/lookForJob/RelatedJobseekerCard';
import { useGetRelatedJobSeekers } from '../../hooks/useGetRelatedJobSeekers';

const { width } = Dimensions.get("window");

const SeekJobDetailsScreen = () => {
  const { id, jobSeekerId } = useLocalSearchParams<{ id: string; jobSeekerId: string }>();
  const { user } = useAuth();

  const { data: product, isError, isLoading } = useGetJobSeekerById(id);

  const { data: regionCandidates = [] } = useGetRelatedJobSeekers({
    region: product?.region,
    category: product?.category,
    seekJobType: product?.seekJobType,
  });

  const openReportModal = useReportModalStore((state) => state.openReportModal);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'list'>('grid');

  const currentUserId = user?._id || user?.id;
  const parsedJobSeekerId = Array.isArray(jobSeekerId) ? jobSeekerId[0] : jobSeekerId;
  const profileUserId =
    typeof product?.user === 'object' ? (product.user as any)?._id : product?.user;

  const owner =
    Boolean(currentUserId) &&
    (String(currentUserId) === String(parsedJobSeekerId) ||
      String(currentUserId) === String(profileUserId));

  const relatedCandidates = useMemo(() => {
    if (!product) return [];

    const list = Array.isArray(regionCandidates)
      ? regionCandidates
      : (regionCandidates as any)?.profiles || (regionCandidates as any)?.profile || [];

    if (!Array.isArray(list)) return [];

    const currentCategory = product.category?.trim().toLowerCase();
    const currentSubCategory = product.seekJobType?.trim().toLowerCase();
    const currentRegion = product.region?.trim().toLowerCase();

    return list
      .filter((item: any) => {
        if (String(item._id) === String(product._id)) return false;

        const sameSubCategory =
          Boolean(currentSubCategory) &&
          item.seekJobType?.trim().toLowerCase() === currentSubCategory;

        const sameCategory =
          Boolean(currentCategory) &&
          item.category?.trim().toLowerCase() === currentCategory;

        const sameRegion =
          Boolean(currentRegion) &&
          item.region?.trim().toLowerCase() === currentRegion;

        return sameSubCategory || sameCategory || sameRegion;
      })
      .sort((a: any, b: any) => {
        const getScore = (item: any) => {
          const subMatch =
            Boolean(currentSubCategory) &&
            item.seekJobType?.trim().toLowerCase() === currentSubCategory
              ? 3
              : 0;
          const catMatch =
            Boolean(currentCategory) &&
            item.category?.trim().toLowerCase() === currentCategory
              ? 2
              : 0;
          const regMatch =
            Boolean(currentRegion) &&
            item.region?.trim().toLowerCase() === currentRegion
              ? 1
              : 0;
          return subMatch + catMatch + regMatch;
        };
        return getScore(b) - getScore(a);
      })
      .slice(0, 6);
  }, [regionCandidates, product]);

  const handleCallSeller = () => {
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to view candidate contact details.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/(auth)") }
        ]
      );
      return;
    }

    if (!product?.isSearchingForJob) {
      Alert.alert("Notice", "This candidate is no longer open to job offers.");
      return;
    }
    if (!product?.phoneNumber) {
      Alert.alert("Error", "Candidate phone number is unavailable.");
      return;
    }

    Linking.openURL(`tel:${product.phoneNumber}`);
  };

  const handleChatCandidate = () => {
    if (!user) {
      router.push("/(auth)");
      return;
    }
    if (!profileUserId) {
      Alert.alert("Error", "Cannot start chat with this candidate.");
      return;
    }
    router.push({
      pathname: '/chat',
      params: { userId: String(profileUserId) },
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      "Saved Profiles",
      !isFavorite ? "Candidate added to your saved list!" : "Candidate removed from saved list."
    );
  };

  if (isLoading) {
    return <LoadingUi />;
  }

  if (isError || !product || Object.keys(product).length === 0) {
    return <ErrorUi />;
  }

  const validImages = product.profilePicture && product.profilePicture.trim().length > 0
    ? [{ uri: product.profilePicture }]
    : [];

  const displayName = product.user && typeof product.user === 'object'
    ? `${(product.user as any).firstName || ''} ${(product.user as any).lastName || ''}`.trim() || "Job Seeker"
    : "Job Seeker";

  const displaySalary = product.expectedSalary?.min
    ? `${product.expectedSalary.currency || 'GHS'} ${Number(product.expectedSalary.min).toLocaleString()}`
    : "Negotiable";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
    });
  };
  return (
    <SafeScreen>
      {/* Absolute Header Overlay */}
      <View className='absolute top-12 right-0 left-0 z-10 px-6 pb-4 flex-row items-center justify-between'>
        <TouchableOpacity
          className='bg-black/50 w-12 h-12 rounded-full items-center justify-center'
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={"#FFFFFF"} />
        </TouchableOpacity>

        <TouchableOpacity
          className='bg-black/50 w-12 h-12 rounded-full items-center justify-center'
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? "#EF4444" : "#FFFFFF"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className='flex-1 bg-white'
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image View */}
        <View className='relative bg-gray-100 m-2 items-center justify-center'>
          {validImages.length > 0 ? (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ width: '100%' }}
                onPress={() => setIsZoomVisible(true)}
              >
                <Image
                  source={product.profilePicture}
                  style={{ width: '100%', height: 400 }}
                  contentFit='cover'
                />
              </TouchableOpacity>

              <ImageView
                images={validImages}
                imageIndex={0}
                visible={isZoomVisible}
                onRequestClose={() => setIsZoomVisible(false)}
                doubleTapToZoomEnabled={true}
                swipeToCloseEnabled={true}
              />
            </>
          ) : (
            <View style={{ width: width - 16, height: 400 }} className="items-center justify-center bg-gray-200 rounded-xl">
              <Ionicons name="person-outline" size={84} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Info Layout Content Wrapper */}
        <View className='p-6'>
          {/* Status, Category, Subcategory & Work Mode Badges */}
          <View className='mb-3 flex-row items-center flex-wrap gap-2'>
            <View className='bg-green-50 px-3 py-1 rounded-full border border-green-100'>
              <Text className='text-green-600 text-xs font-bold capitalize'>
                {product.workMode || "On-site"}
              </Text>
            </View>

            <View className={`px-3 py-1 rounded-full ${product.isSearchingForJob ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
              <Text className={`text-xs font-bold ${product.isSearchingForJob ? 'text-emerald-600' : 'text-rose-600'}`}>
                {product.isSearchingForJob ? 'Open to Work' : 'Not Available'}
              </Text>
            </View>

            {product.category ? (
              <View className='bg-blue-50 px-3 py-1 rounded-full border border-blue-100'>
                <Text className='text-blue-700 text-xs font-bold capitalize'>
                  {product.category}
                </Text>
              </View>
            ) : null}

            {product.seekJobType ? (
              <View className='bg-purple-50 px-3 py-1 rounded-full border border-purple-100'>
                <Text className='text-purple-700 text-xs font-bold capitalize'>
                  {product.seekJobType}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Headline, Name & Report Action */}
          <View className='flex-row justify-between items-start gap-3 mb-2'>
            <View className='flex-1'>
              <Text className='text-2xl font-extrabold text-gray-900 leading-tight'>
                {product.professionalHeadline}
              </Text>
              <Text className='text-base font-semibold text-gray-500 mt-1'>
                {displayName}
              </Text>
            </View>

            {!owner && (
              <TouchableOpacity
                onPress={() => openReportModal("JobSeeker", product._id)}
                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full border border-red-100"
                activeOpacity={0.7}
              >
                <Text className="text-red-600 text-xs font-semibold">Report</Text>
                <Ionicons name="flag-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>

          {/* Expected Salary & Location */}
          <View className='flex-row items-center justify-between py-3 my-3 border-y border-gray-100'>
            <View>
              <Text className='text-xs text-gray-400 font-semibold uppercase'>Expected Salary</Text>
              <Text className='text-lg font-extrabold text-blue-600 mt-0.5'>
                {displaySalary}
              </Text>
            </View>

            {(product.region || product.district) ? (
              <View className='items-end flex-1 ml-4'>
                <Text className='text-xs text-gray-400 font-semibold uppercase'>Location</Text>
                <View className='flex-row items-center mt-0.5'>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text className='text-sm font-semibold text-gray-700 ml-1' numberOfLines={1}>
                    {[product.district, product.region].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Preferred Job Types */}
          {Array.isArray(product.preferredJobTypes) && product.preferredJobTypes.length > 0 ? (
            <View className='mb-5'>
              <Text className='text-sm font-extrabold text-gray-900 mb-2'>
                Preferred Job Types
              </Text>
              <View className='flex-row flex-wrap gap-2'>
                {product.preferredJobTypes.map((jobType: string) => (
                  <View
                    key={jobType}
                    className='bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg'
                  >
                    <Text className='text-gray-700 text-xs font-semibold'>{jobType}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Bio / Summary */}
          {product.bio ? (
            <View className='mb-5'>
              <Text className='text-sm font-extrabold text-gray-900 mb-1.5'>About Candidate</Text>
              <Text className='text-gray-600 text-sm leading-relaxed'>{product.bio}</Text>
            </View>
          ) : null}

          {/* Skills */}
          {Array.isArray(product.skills) && product.skills.length > 0 ? (
            <View className='mb-5'>
              <Text className='text-sm font-extrabold text-gray-900 mb-2'>Skills & Expertise</Text>
              <View className='flex-row flex-wrap gap-2'>
                {product.skills.map((skill: string, idx: number) => (
                  <View key={`${skill}-${idx}`} className='bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-full'>
                    <Text className='text-blue-700 text-xs font-bold'>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Resume Download / Preview */}
          {product.resumeUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(product.resumeUrl!)}
              activeOpacity={0.8}
              className='flex-row items-center justify-between p-4 mb-5 bg-blue-50 border border-blue-200 rounded-2xl'
            >
              <View className='flex-row items-center flex-1'>
                <Ionicons name="document-text" size={24} color="#2563EB" />
                <View className='ml-3'>
                  <Text className='text-gray-900 font-bold text-sm'>Attached Resume / CV</Text>
                  <Text className='text-blue-600 text-xs font-medium'>Tap to view PDF document</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
          ) : null}

          {/* Education History */}
          {Array.isArray(product.education) && product.education.length > 0 ? (
            <View className='mb-5'>
              <Text className='text-sm font-extrabold text-gray-900 mb-2.5'>Education</Text>
              <View className='gap-3'>
                {product.education.map((edu: any, idx: number) => (
                  <View key={edu._id || idx} className='p-3.5 bg-gray-50 border border-gray-100 rounded-xl'>
                    <Text className='text-gray-900 font-bold text-sm'>{edu.degree}</Text>
                    <Text className='text-gray-600 text-xs font-medium mt-0.5'>{edu.schoolName}</Text>
                    <Text className='text-gray-400 text-xs mt-1'>
                      {formatDate(edu.startDate)} — {edu.isCurrentEducation ? 'Present' : formatDate(edu.endDate)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Candidate Reviews & Ratings */}
          {!owner && (<ItemReviewsSection
            targetId={product._id}
            targetType="JobSeeker"
            averageRating={product.averageRating}
            totalReviewsCount={product.totalReviews}
            isOwner={owner}
            title="Candidate Reviews & Ratings"
          />)}

          {/* Related Candidates */}
          {relatedCandidates.length > 0 ? (
            <View className='mt-6 pt-5 border-t border-gray-100'>
              <View className='flex-row justify-between items-center mb-3'>
                <Text className='text-base font-extrabold text-gray-900'>Similar Candidates</Text>
                <View className='flex-row gap-2'>
                  <TouchableOpacity onPress={() => setRelatedViewMode('grid')}>
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={relatedViewMode === 'grid' ? '#2563EB' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRelatedViewMode('list')}>
                    <Ionicons
                      name="list-outline"
                      size={20}
                      color={relatedViewMode === 'list' ? '#2563EB' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className={relatedViewMode === 'grid' ? 'flex-row flex-wrap justify-between' : 'gap-3'}>
                {relatedCandidates.map((candidate: any) => (
                  <RelatedJobSeekerCard
                    key={candidate._id}
                    item={candidate}
                    viewMode={relatedViewMode}
                    onPress={() => router.push(`/seek-job/${candidate._id}` as any)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      {!owner && (
        <View className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex-row gap-3'>
          <TouchableOpacity
            onPress={handleChatCandidate}
            activeOpacity={0.85}
            className='flex-1 py-3.5 rounded-2xl border border-blue-600 flex-row items-center justify-center'
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2563EB" />
            <Text className='text-blue-600 font-bold text-base ml-2'>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCallSeller}
            activeOpacity={0.85}
            className='flex-1 py-3.5 rounded-2xl bg-blue-600 flex-row items-center justify-center'
          >
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            <Text className='text-white font-bold text-base ml-2'>Call Candidate</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeScreen>
  );
};

export default SeekJobDetailsScreen;








// import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking, ActivityIndicator } from 'react-native'
// import React, { useState, useMemo } from 'react'
// import { router, useLocalSearchParams } from 'expo-router'
// import { useGetJobSeekerById } from '../../hooks/useGetJobSeekerById'
// import ErrorUi from '../../components/ErrorUi'
// import LoadingUi from '../../components/LoadingUi'
// import SafeScreen from '../../components/SafeScreen'
// import { Ionicons } from '@expo/vector-icons'
// import { Image } from 'expo-image'
// import ImageView from '../../components/CrossPlatformImageView.native';
// import { useAuth } from '../../contexts/authContext';
// import { useReportModalStore } from '../../stores/useReportModalStore'
// import ItemReviewsSection from '../../components/reviews/ItemsReviewsSection'
// import RelatedJobSeekerCard, { RelatedSeekJobCard } from '../../components/lookForJob/RelatedJobseekerCard'
// import { useGetRelatedJobSeekers } from '../../hooks/useGetRelatedJobSeekers';


// const { width } = Dimensions.get("window")

// const SeekJobDetailsScreen = () => {
//   const { id, jobSeekerId } = useLocalSearchParams<{ id: string; jobSeekerId: string }>();
//   const { user } = useAuth()

//   const { data: product, isError, isLoading } = useGetJobSeekerById(id)

//   // Keep your original variable name (e.g., relatedCandidates) on the left of '=':
//   const { data: regionCandidates = [] } = useGetRelatedJobSeekers({
//     region: product?.region,
//     category: product?.category,
//     seekJobType: product?.seekJobType,
//   });


//   const openReportModal = useReportModalStore((state) => state.openReportModal);
//   const [isFavorite, setIsFavorite] = useState(false)
//   const [isZoomVisible, setIsZoomVisible] = useState(false);
//   const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'list'>('grid');

//   const currentUserId = user?._id || user?.id;
//   const parsedJobSeekerId = Array.isArray(jobSeekerId) ? jobSeekerId[0] : jobSeekerId;
//   const profileUserId =
//     typeof product?.user === 'object' ? (product.user as any)?._id : product?.user;

//   const owner =
//     Boolean(currentUserId) &&
//     (String(currentUserId) === String(parsedJobSeekerId) ||
//       String(currentUserId) === String(profileUserId));



//   const relatedCandidates = useMemo(() => {
//     if (!product) return [];

//     // Safely unwrap array regardless of API wrapper shape
//     const list = Array.isArray(regionCandidates)
//       ? regionCandidates
//       : (regionCandidates as any)?.profiles || (regionCandidates as any)?.profile || [];

//     if (!Array.isArray(list)) return [];

//     const currentCategory = (product as any).category?.trim().toLowerCase();
//     const currentRegion = (product as any).region?.trim().toLowerCase();

//     return list
//       .filter((item: any) => {
//         // 1. Exclude the candidate currently being viewed
//         if (String(item._id) === String(product._id)) return false;

//         // 2. Match strictly by category or region
//         const sameCategory =
//           Boolean(currentCategory) &&
//           item.category?.trim().toLowerCase() === currentCategory;

//         const sameRegion =
//           Boolean(currentRegion) &&
//           item.region?.trim().toLowerCase() === currentRegion;

//         return sameCategory || sameRegion;
//       })
//       .sort((a: any, b: any) => {
//         const getScore = (item: any) => {
//           const catMatch =
//             Boolean(currentCategory) &&
//               item.category?.trim().toLowerCase() === currentCategory
//               ? 2
//               : 0;
//           const regMatch =
//             Boolean(currentRegion) &&
//               item.region?.trim().toLowerCase() === currentRegion
//               ? 1
//               : 0;
//           return catMatch + regMatch;
//         };
//         return getScore(b) - getScore(a);
//       })
//       .slice(0, 6);
//   }, [regionCandidates, product]);


//   const handleCallSeller = () => {
//     if (!user) {
//       Alert.alert(
//         "Authentication Required",
//         "Please sign in to view candidate contact details.",
//         [
//           { text: "Cancel", style: "cancel" },
//           { text: "Sign In", onPress: () => router.push("/(auth)") }
//         ]
//       );
//       return;
//     }

//     if (!product?.isSearchingForJob) {
//       Alert.alert("Notice", "This candidate is no longer open to job offers.");
//       return;
//     }
//     if (!product?.phoneNumber) {
//       Alert.alert("Error", "Candidate phone number is unavailable.");
//       return;
//     }

//     Linking.openURL(`tel:${product.phoneNumber}`);
//   }

//   const handleToggleFavorite = () => {
//     setIsFavorite(!isFavorite)
//     Alert.alert(
//       "Saved Profiles",
//       !isFavorite ? "Candidate added to your saved list!" : "Candidate removed from saved list."
//     )
//   }

//   if (isLoading) {
//     return <LoadingUi />
//   }

//   if (isError || !product || Object.keys(product).length === 0) {
//     return <ErrorUi />
//   }

//   const validImages = product.profilePicture && product.profilePicture.trim().length > 0
//     ? [{ uri: product.profilePicture }]
//     : [];

//   const displayName = product.user && typeof product.user === 'object'
//     ? `${(product.user as any).firstName || ''} ${(product.user as any).lastName || ''}`.trim() || "Job Seeker"
//     : "Job Seeker";

//   // Helper date formatter function
//   const formatDate = (dateStr?: string) => {
//     if (!dateStr) return '';
//     return new Date(dateStr).toLocaleDateString(undefined, {
//       year: 'numeric',
//       month: 'short'
//     });
//   };

//   return (
//     <SafeScreen>
//       {/* Absolute Header Overlay */}
//       <View className='absolute top-12 right-0 left-0 z-10 px-6 pb-4 flex-row items-center justify-between'>
//         <TouchableOpacity
//           className='bg-black/50 w-12 h-12 rounded-full items-center justify-center'
//           onPress={() => router.back()}
//           activeOpacity={0.7}
//         >
//           <Ionicons name='arrow-back' size={24} color={"#FFFFFF"} />
//         </TouchableOpacity>

//         <TouchableOpacity
//           className='bg-black/50 w-12 h-12 rounded-full items-center justify-center'
//           onPress={handleToggleFavorite}
//           activeOpacity={0.7}
//         >
//           <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? "#EF4444" : "#FFFFFF"} />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         className='flex-1 bg-white'
//         contentContainerStyle={{ paddingBottom: 160 }}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Profile Image View */}
//         <View className='relative bg-gray-100 m-2 items-center justify-center' >
//           {validImages.length > 0 ? (
//             <>
//               <TouchableOpacity
//                 activeOpacity={0.9}
//                 style={{ width: '100%' }}
//                 onPress={() => setIsZoomVisible(true)}
//               >
//                 <Image
//                   source={product.profilePicture}
//                   style={{ width: '100%', height: 400 }}
//                   contentFit='cover'
//                 />
//               </TouchableOpacity>

//               <ImageView
//                 images={validImages}
//                 imageIndex={0}
//                 visible={isZoomVisible}
//                 onRequestClose={() => setIsZoomVisible(false)}
//                 doubleTapToZoomEnabled={true}
//                 swipeToCloseEnabled={true}
//               />
//             </>
//           ) : (
//             <View style={{ width: width - 16, height: 400 }} className="items-center justify-center bg-gray-200 rounded-xl">
//               <Ionicons name="person-outline" size={84} color="#9CA3AF" />
//             </View>
//           )}
//         </View>

//         {/* Info Layout Content Wrapper */}
//         <View className='p-6'>
//           {/* Status Badges */}
//           <View className='mb-3 flex-row items-center flex-wrap gap-2'>
//             <View className='bg-green-50 px-3 py-1 rounded-full border border-green-100'>
//               <Text className='text-green-600 text-xs font-bold capitalize'>{product.workMode || "On-site"}</Text>
//             </View>

//             <View className={`px-3 py-1 rounded-full ${product.isSearchingForJob ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
//               <Text className={`text-xs font-bold ${product.isSearchingForJob ? 'text-emerald-600' : 'text-rose-600'}`}>
//                 {product.isSearchingForJob ? 'Actively Looking' : 'Hired / Inactive'}
//               </Text>
//             </View>

//             {/* Post/Profile Registration Timestamp Date Badge */}
//             {product.createdAt && (
//               <View className='bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex-row items-center gap-1'>
//                 <Ionicons name="calendar-outline" size={12} color="#2563EB" />
//                 <Text className='text-blue-600 text-xs font-medium'>
//                   Joined {new Date(product.createdAt).toLocaleDateString(undefined, {
//                     year: 'numeric',
//                     month: 'short',
//                     day: 'numeric'
//                   })}
//                 </Text>
//               </View>
//             )}
//           </View>

//           {/* Candidate Name & Title */}
//           <Text className='text-gray-900 text-2xl font-bold mb-1'>{displayName}</Text>
//           <Text className='text-gray-600 text-lg font-medium mb-3'>{product.professionalHeadline}</Text>

//           {/* ategory & Product  Type */}
//           {product.category ? (
//             <View className='bg-blue-50 px-3 py-1 rounded-full border border-blue-100'>
//               <Text className='text-blue-600 text-xs font-bold capitalize'>{product.category}</Text>
//             </View>
//           ) : null}

//           {product.seekJobType ? (
//             <View className='bg-purple-50 px-3 py-1 rounded-full border border-purple-100'>
//               <Text className='text-purple-600 text-xs font-bold capitalize'>{product.seekJobType}</Text>
//             </View>
//           ) : null}

//           {/* Expected Salary Display mapped from backend min value */}
//           <View className='flex-row items-center mb-4'>
//             <Text className='text-green-600 text-2xl font-black'>
//               {product.expectedSalary?.currency || 'GHS'} {product.expectedSalary?.min?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
//               <Text className="text-gray-500 text-sm font-normal"> / month expected</Text>
//             </Text>
//           </View>

//           {/* Location Info Block */}
//           {(product.region || product.district) && (
//             <View className="flex-row items-center gap-1 mb-4">
//               <Ionicons name="location-outline" size={16} color="#6B7280" />
//               <Text className="text-gray-500 font-medium">
//                 {[product.district, product.region].filter(Boolean).join(", ")}
//               </Text>
//             </View>
//           )}

//           {/* Bio Section */}
//           {product.bio && (
//             <View className="mb-6">
//               <Text className="text-gray-900 font-bold text-base mb-2">About Candidate</Text>
//               <Text className="text-gray-600 leading-6">{product.bio}</Text>
//             </View>
//           )}

//           {/* Skills Badges Wrapper */}
//           {product.skills && product.skills.length > 0 && (
//             <View className="mb-6">
//               <Text className="text-gray-900 font-bold text-base mb-2">Skills</Text>
//               <View className="flex-row flex-wrap gap-2">
//                 {product.skills.map((skill: string, idx: number) => (
//                   <View key={idx} className="bg-gray-100 px-3 py-1.5 rounded-lg">
//                     <Text className="text-gray-700 text-sm font-medium">{skill}</Text>
//                   </View>
//                 ))}
//               </View>
//             </View>
//           )}

//           {/* Experience Timeline Section */}
//           {product.experience && product.experience.length > 0 && (
//             <View className="mb-6">
//               <Text className="text-gray-900 font-bold text-base mb-3">Work Experience</Text>
//               {product.experience.map((exp: any, idx: number) => (
//                 <View key={idx} className="mb-4 pl-4 border-l-2 border-gray-200 relative">
//                   <View className="absolute left-[-5px] top-[6px] w-[8px] h-[8px] rounded-full bg-green-500" />
//                   <Text className="text-gray-900 font-bold text-sm">{exp.jobTitle}</Text>
//                   <Text className="text-gray-700 text-xs font-medium">{exp.companyName} {exp.location ? `• ${exp.location}` : ''}</Text>
//                   <Text className="text-gray-400 text-xs mt-0.5">
//                     {formatDate(exp.startDate)} - {exp.isCurrentJob ? "Present" : formatDate(exp.endDate)}
//                   </Text>
//                   {exp.description && <Text className="text-gray-500 text-xs mt-1 leading-5">{exp.description}</Text>}
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* Education Timeline Section */}
//           {product.education && product.education.length > 0 && (
//             <View className="mb-6">
//               <Text className="text-gray-900 font-bold text-base mb-3">Education</Text>
//               {product.education.map((edu: any, idx: number) => (
//                 <View key={idx} className="mb-4 pl-4 border-l-2 border-gray-200 relative">
//                   <View className="absolute left-[-5px] top-[6px] w-[8px] h-[8px] rounded-full bg-blue-500" />
//                   <Text className="text-gray-900 font-bold text-sm">
//                     {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
//                   </Text>
//                   <Text className="text-gray-700 text-xs font-medium">{edu.schoolName}</Text>
//                   <Text className="text-gray-400 text-xs mt-0.5">
//                     {formatDate(edu.startDate)} - {edu.isCurrentEducation ? "Present" : formatDate(edu.endDate)}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           )}

          // {/* Candidate Reviews & Ratings */}
          // {!owner && (<ItemReviewsSection
          //   targetId={product._id}
          //   targetType="JobSeeker"
          //   averageRating={product.averageRating}
          //   totalReviewsCount={product.totalReviews}
          //   isOwner={owner}
          //   title="Candidate Reviews & Ratings"
          // />)}


//           {/*  Added clean Trust & Safety report block directly below the content wrapper */}
//           {!owner && (
//             <View className="px-6 mt-2">
//               <TouchableOpacity
//                 onPress={() => openReportModal('JobSeeker', product._id)}
//                 activeOpacity={0.7}
//                 className="flex-row items-center justify-between p-4 bg-red-50/60 border border-red-100 rounded-2xl"
//               >
//                 <View className="flex-row items-center flex-1 mr-3">
//                   <View className="w-9 h-9 rounded-full bg-red-100 items-center justify-center mr-3">
//                     <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
//                   </View>
//                   <View className="flex-1">
//                     <Text className="text-sm font-semibold text-gray-900">Report this listing</Text>
//                     <Text className="text-xs text-gray-500 mt-0.5">Flag this item if you suspect fraud, scams,</Text>
//                   </View>
//                 </View>
//                 <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
//               </TouchableOpacity>
//             </View>
//           )}

//         </View>

//         {/* related adds  */}
//         {relatedCandidates.length > 0 && (
//           <View className="mt-6 pt-6 border-t border-gray-100">
//             {/* Header & Single / 2-Column Toggle Bar */}
//             <View className="flex-row items-center justify-between mb-4">
//               <View>
//                 <Text className="text-gray-900 text-lg font-bold">Related Ads</Text>
//                 <Text className="text-gray-400 text-xs">
//                   More providers in {product.category || product.region || 'this area'}
//                 </Text>
//               </View>

//               <TouchableOpacity
//                 onPress={() =>
//                   setRelatedViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))
//                 }
//                 activeOpacity={0.7}
//                 className="bg-gray-100 p-2 rounded-xl border border-gray-200/70"
//               >
//                 <Ionicons
//                   name={relatedViewMode === 'grid' ? 'list-outline' : 'grid-outline'}
//                   size={20}
//                   color="#2563EB"
//                 />
//               </TouchableOpacity>
//             </View>

//             {/* Cards Grid / List */}
//             <View className="flex-row flex-wrap justify-between">
//               {relatedCandidates.map((candidate) => (
//                 <RelatedSeekJobCard
//                   key={candidate._id}
//                   item={candidate}
//                   viewMode={relatedViewMode}
//                   onPress={() =>
//                     router.push({
//                       pathname: '/seek-job/[id]',
//                       params: { id: candidate._id },
//                     })
//                   }
//                 />
//               ))}
//             </View>
//           </View>
//         )}


//       </ScrollView>

//       {/* Action Footer for External Clients */}
//       {!owner && (
//         <View className="absolute bottom-0 right-0 left-0 bg-white/95 border-t border-gray-100 p-6 pb-20 flex-row items-center gap-3">
//           {/* Chat with Candidate Button */}
//           <TouchableOpacity
//             onPress={() => router.push({ pathname: "/chat" as any, params: { userId: parsedJobSeekerId } })}
//             activeOpacity={0.8}
//             className="flex-1 h-12 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2"
//           >
//             <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
//             <Text className="text-white font-bold text-sm">Chat</Text>
//           </TouchableOpacity>

//           {/* Dial candidate over cell network */}
//           <TouchableOpacity
//             onPress={handleCallSeller}
//             activeOpacity={0.8}
//             className="flex-1 h-12 bg-green-600 rounded-xl flex-row items-center justify-center gap-2"
//           >
//             <Ionicons name="call" size={18} color="#FFFFFF" />
//             <Text className="text-white font-bold text-sm">Call Candidate</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </SafeScreen>
//   )
// }

// export default SeekJobDetailsScreen;
