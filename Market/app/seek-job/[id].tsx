import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetJobSeekerById } from '../../hooks/useGetJobSeekerById';
import ErrorUi from '../../components/ErrorUi';
import LoadingUi from '../../components/LoadingUi';
import SafeScreen from '../../components/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ImageView from '../../components/CrossPlatformImageView';
import { useAuth } from '../../contexts/authContext';
import { useReportModalStore } from '../../stores/useReportModalStore';
import ItemReviewsSection from '../../components/reviews/ItemsReviewsSection';
import RelatedJobSeekerCard from '../../components/lookForJob/RelatedJobseekerCard';
import { useGetRelatedJobSeekers } from '../../hooks/useGetRelatedJobSeekers';
import useFollow from '../../hooks/useFollow';

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



  const targetCandidateUserId = profileUserId || parsedJobSeekerId;
  const {
    toggleFollow,
    togglingUserId,
    isFollowingUser,
    followersCount: candidateFollowersCount,
  } = useFollow(targetCandidateUserId);
  const owner =
    Boolean(currentUserId) &&
    (String(currentUserId) === String(parsedJobSeekerId) ||
      String(currentUserId) === String(profileUserId));


  const isFollowingCandidate = isFollowingUser(targetCandidateUserId);
  const isTogglingCandidate = togglingUserId === targetCandidateUserId;

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
  const handleWhatsAppCandidate = () => {
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to contact this candidate on WhatsApp.",
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

    // Format phone number for WhatsApp (converts local '0XXXXXXXXX' to '233XXXXXXXXX')
    let cleanPhone = product.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = `233${cleanPhone.slice(1)}`;
    }

    const message = `Hello ${displayName}, I saw your job seeker profile (${product.professionalHeadline || product.category || 'Candidate'}) and would like to discuss a job opportunity.`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web') {
      Linking.openURL(whatsappUrl);
      return;
    }

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert("Error", "WhatsApp is not installed on your device.");
        }
      })
      .catch(() => {
        Alert.alert("Error", "Unable to open WhatsApp.");
      });
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
        style={{ flex: 1 }}
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Profile Image View */}
        <View className='relative bg-gray-100 m-2 items-center justify-center'>
          {validImages.length > 0 ? (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                className="w-full h-[400px] items-center justify-center bg-gray-200 rounded-xl"
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

          {/* Candidate Follow / Following Card */}
          {!owner && Boolean(targetCandidateUserId) && (
            <View className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-3.5 my-4">
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/user/[id]',
                    params: { id: String(targetCandidateUserId) },
                  })
                }
                className="flex-row items-center flex-1 pr-3"
              >
                <View className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden items-center justify-center mr-3 shrink-0">
                  {product?.profilePicture ? (
                    <Image
                      source={{ uri: product.profilePicture }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={20} color="#4B5563" />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {candidateFollowersCount}{' '}
                    {candidateFollowersCount === 1 ? 'Follower' : 'Followers'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isTogglingCandidate}
                onPress={() => {
                  if (!user) {
                    router.push('/(auth)');
                    return;
                  }
                  toggleFollow(targetCandidateUserId!);
                }}
                className={`px-4 py-2.5 rounded-xl border flex-row items-center gap-1.5 ${isFollowingCandidate
                    ? 'bg-white border-gray-300'
                    : 'bg-blue-600 border-blue-600'
                  }`}
              >
                {isTogglingCandidate ? (
                  <ActivityIndicator
                    size="small"
                    color={isFollowingCandidate ? '#111827' : '#FFFFFF'}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={isFollowingCandidate ? 'checkmark' : 'person-add-outline'}
                      size={15}
                      color={isFollowingCandidate ? '#111827' : '#FFFFFF'}
                    />
                    <Text
                      className={`text-xs font-bold ${isFollowingCandidate ? 'text-gray-900' : 'text-white'
                        }`}
                    >
                      {isFollowingCandidate ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

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
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 mb-12 px-4 py-3 flex-row items-center gap-2.5">
          {/* Call Button */}
          <TouchableOpacity
            onPress={handleCallSeller}
            activeOpacity={0.8}
            className="flex-1 bg-blue-600 py-3.5 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Call</Text>
          </TouchableOpacity>

          {/* WhatsApp Button */}
          <TouchableOpacity
            onPress={handleWhatsAppCandidate}
            activeOpacity={0.8}
            className="flex-1 bg-[#25D366] py-3.5 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">WhatsApp</Text>
          </TouchableOpacity>

          {/* In-App Chat Button */}
          <TouchableOpacity
            onPress={handleChatCandidate}
            activeOpacity={0.8}
            className="flex-1 bg-gray-900 py-3.5 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Chat</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeScreen>
  );
};

export default SeekJobDetailsScreen;