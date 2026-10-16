import { View, Text, Alert, TouchableOpacity, ScrollView, Dimensions, Linking, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import ErrorUi from '../../components/ErrorUi'
import LoadingUi from '../../components/LoadingUi'
import SafeScreen from '../../components/SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import ImageView from 'react-native-image-viewing'
import { useAuth } from '../../contexts/authContext'
import { useGetJob } from '../../hooks/usegetJob'
import { useToggleJobStatus } from '../../hooks/useToggleJobStatus'

const { width } = Dimensions.get("window")

const JobDetailsScreen = () => {
  const { id, employerId } = useLocalSearchParams<{ id: string; employerId: string }>();

  const { data: job, isError, isLoading } = useGetJob(id)
  const { user } = useAuth()
  const toggleMutation = useToggleJobStatus()

  const [isFavorite, setIsFavorite] = useState(false)
  const [isZoomVisible, setIsZoomVisible] = useState(false)

  //const owner = user?.id === (Array.isArray(employerId) ? employerId[0] : employerId);
  const owner = user?.id === undefined


  const handleCallEmployer = () => {
    if (!job?.isOpen) {
      Alert.alert("Notice", "Applications for this job listing have been closed.");
      return;
    }
    if (!job?.phoneNumber) {
      Alert.alert("Unavailable", "The employer did not specify a contact phone number.");
      return;
    }
    Linking.openURL(`tel:${job.phoneNumber}`);
  }

  const handleEmailApply = () => {
    if (!job?.isOpen) {
      Alert.alert("Notice", "Applications for this job listing have been closed.");
      return;
    }
    if (!job?.emailForApplications) {
      Alert.alert("Unavailable", "Direct email applications are not enabled for this position.");
      return;
    }
    Linking.openURL(`mailto:${job.emailForApplications}?subject=Application for ${job.title}`);
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    Alert.alert(
      "Favorites",
      !isFavorite ? "Vacancy added to your bookmarks!" : "Vacancy removed from bookmarks."
    )
  }

  const handleStatusUpdate = () => {
    if (!id) return;

    toggleMutation.mutate(id, {
      onSuccess: (data: any) => {
        Alert.alert("Success", data?.message || "Job pipeline status successfully updated!");
      },
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.message || "Something went wrong while updating vacancy status.";
        Alert.alert("Action Denied", errorMsg);
      }
    });
  }

  if (isLoading) return <LoadingUi />
  if (isError || !job || Object.keys(job).length === 0) return <ErrorUi />

  const validImage = job.jobImage ? job.jobImage : null;

  return (
    <SafeScreen>
      {/* Absolute Floating Header Overlay */}
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
          <Ionicons name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={22} color={isFavorite ? "#3B82F6" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className='flex-1 bg-white'
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Frame Display Layout */}
        <View className='relative bg-gray-100 m-2 rounded-2xl overflow-hidden shadow-sm'>
          {validImage ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setIsZoomVisible(true)}
            >
              <Image
                source={{ uri: validImage }}
                style={{ width: width - 16, height: 260 }}
                contentFit='cover'
                transition={200}
                cachePolicy="disk"
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: width - 16, height: 260 }} className="items-center justify-center bg-gray-200">
              <Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
            </View>
          )}

          {/* Lightbox Structural Overlay Mapper Layer */}
          {validImage && (
            <ImageView
              images={[{ uri: validImage }]}
              imageIndex={0}
              visible={isZoomVisible}
              onRequestClose={() => setIsZoomVisible(false)}
              doubleTapToZoomEnabled={true}
              swipeToCloseEnabled={true}
            />
          )}
        </View>

        {/* Core Content Parameters layout mapping frame */}
        <View className='p-6'>

          {/* Metadata Badges Pillar */}
          <View className='mb-4 flex-row flex-wrap items-center gap-2'>
            <View className='bg-blue-50 px-3 py-1 rounded-full border border-blue-100'>
              <Text className='text-blue-600 text-xs font-bold capitalize'>{job.workMode}</Text>
            </View>
            <View className='bg-purple-50 px-3 py-1 rounded-full border border-purple-100'>
              <Text className='text-purple-600 text-xs font-bold'>{job.jobType || 'Full-time'}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${job.isOpen ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
              <Text className={`text-xs font-bold ${job.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                {job.isOpen ? 'Active Hiring' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Job Nomenclature Headers */}
          <Text className='text-gray-900 text-2xl font-extrabold mb-1'>{job.title}</Text>
          <Text className='text-gray-500 text-base font-semibold mb-4'>{job.companyName}</Text>

          {/* Salary Parameter Formatting Blocks */}
          <View className='mb-5 p-4 bg-gray-50 rounded-2xl flex-row items-center justify-between border border-gray-100'>
            <View>
              <Text className='text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5'>Remuneration Budget</Text>
              <Text className='text-green-600 text-2xl font-black'>
                {job.salary?.min && job.salary?.max
                  ? `${job.salary.currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
                  : 'Negotiable'}
              </Text>
            </View>
            <Text className='text-gray-500 bg-gray-200/60 px-2.5 py-1 rounded-md text-xs font-bold uppercase'>
              {job.salary?.period || 'monthly'}
            </Text>
          </View>

          {/* Geography Context Layout */}
          <View className='flex-row items-center gap-2 bg-gray-50 p-3.5 rounded-xl mb-6 border border-gray-100/50'>
            <Ionicons name="location-outline" size={20} color="#4B5563" />
            <Text className='text-gray-600 text-sm font-medium flex-1' numberOfLines={2}>
              {job.location}, {job.district} - {job.region}
            </Text>
          </View>

          {/* Description Markdown Text Segment */}
          <View className='mb-6'>
            <Text className='text-gray-900 text-base font-bold mb-2'>Role Description</Text>
            <Text className='text-gray-600 text-sm leading-relaxed'>{job.description}</Text>
          </View>

          {/* Array Field Iteration: Job Requirements mapping */}
          {job.requirements && job.requirements.length > 0 && (
            <View className='mb-6'>
              <Text className='text-gray-900 text-base font-bold mb-2.5'>Requirements & Criteria</Text>
              {job.requirements.map((req: string, idx: number) => (
                <View key={idx} className='flex-row items-start mb-2 pl-1'>
                  <Text className='text-blue-500 text-base mr-2 mt-[-2px]'>•</Text>
                  <Text className='text-gray-600 text-sm flex-1 leading-normal'>{req}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Array Field Iteration: Job Benefits mapping */}
          {job.benefits && job.benefits.length > 0 && (
            <View className='mb-6'>
              <Text className='text-gray-900 text-base font-bold mb-2.5'>Perks & Compensation</Text>
              {job.benefits.map((benefit: string, idx: number) => (
                <View key={idx} className='flex-row items-start mb-2 pl-1'>
                  <Text className='text-emerald-500 text-base mr-2 mt-[-2px]'>✓</Text>
                  <Text className='text-gray-600 text-sm flex-1 leading-normal'>{benefit}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Administrative Control Dashboard panel */}
  
          {owner && (
            <View className="mb-6 p-4 bg-slate-50 border border-slate-200/70 rounded-3xl shadow-sm">
              <Text className="text-slate-900 font-extrabold text-sm mb-3">
                Recruiter Management Dashboard
              </Text>

              {/* BUTTON 1: Navigates straight to the incoming Candidate Pipelines Tracker */}
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: `/jobs/${job._id}/applications` as any,
                    params: {
                      jobId: job._id,
                      jobTitle: job.title
                    }
                  });
                }}
                activeOpacity={0.8}
                className="w-full bg-blue-600 h-12 rounded-xl flex-row items-center justify-center gap-2 mb-3 shadow-sm shadow-blue-500/10 active:bg-blue-700"
              >
                <Ionicons name="people-outline" size={18} color="#FFFFFF" />
              

                <Text className="text-white font-extrabold text-sm uppercase tracking-wide">
                  {`Review Applications (${(job as any)?.applications?.length || 0})`}
                </Text>

              </TouchableOpacity>

              {/* BUTTON 2: Existing toggle mechanism to invert pipeline state visibility parameters */}
              <TouchableOpacity
                disabled={toggleMutation.isPending}
                onPress={handleStatusUpdate}
                activeOpacity={0.8}
                className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 border ${job.isOpen
                    ? 'bg-amber-50 border-amber-200 active:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 active:bg-emerald-100'
                  }`}
              >
                {toggleMutation.isPending ? (
                  <ActivityIndicator size="small" color={job.isOpen ? "#B45309" : "#047857"} />
                ) : (
                  <>
                    <Ionicons
                      name={job.isOpen ? "lock-closed-outline" : "refresh-outline"}
                      size={18}
                      color={job.isOpen ? "#B45309" : "#047857"}
                    />
                    <Text className={`font-black text-sm uppercase tracking-wide ${job.isOpen ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {job.isOpen ? "Close This Job Post" : "Re-open Vacancy Pipeline"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}


        </View>
      </ScrollView>

      {/* Floating Application Action Controls Footer */}
      {!owner && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-20 flex-row gap-3 shadow-lg">
          {job.phoneNumber && (
            <TouchableOpacity
              onPress={handleCallEmployer}
              className="flex-1 bg-gray-100 h-14 rounded-2xl flex-row items-center justify-center gap-2 border border-gray-200"
            >
              <Ionicons name="call" size={18} color="#374151" />
              <Text className="text-gray-800 font-bold text-base">Call Office</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (!job?.isOpen) {
                Alert.alert("Notice", "Applications for this job listing have been closed.");
                return;
              }

              router.push({
                pathname: `/apply/${job._id}` as any,
                params: {
                  jobId: job._id,
                  jobTitle: job.title,
                  companyName: job.companyName,
                  employerId: typeof job.employer === 'object' ? (job.employer as any)._id : job.employer
                }
              });
            }}
            activeOpacity={0.85}
            className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:bg-blue-700"
          >
            <Ionicons name="paper-plane" size={18} color="white" />
            <Text className="text-white font-bold text-base">Apply Now</Text>
          </TouchableOpacity>

        </View>
      )}
    </SafeScreen>
  )
}

export default JobDetailsScreen;
