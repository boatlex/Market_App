import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { JobSeekerProfile } from '../../types';

interface MyJobSeekerProfileListProps {
  profiles: JobSeekerProfile[];
  onEdit: (profile: JobSeekerProfile) => void;
  onDelete: (id: string) => void;
}

export const MyJobSeekerProfileList = ({ profiles, onEdit, onDelete }: MyJobSeekerProfileListProps) => {
  return (
    <FlatList
      data={profiles}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListEmptyComponent={() => (
        <View className="items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <Ionicons name="person-search-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 font-extrabold text-sm mt-3 text-center">No Candidate Resume File Setup</Text>
          <Text className="text-gray-400 font-medium text-xs mt-1 text-center">Setup a profile card to start matching with employers in Ghana.</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View className="bg-white border border-gray-100 p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center flex-1 mr-3">
            <Image 
              source={{ uri: item.profilePicture || 'https://placehold.co' }} 
              style={{ width: 56, height: 56 }} 
              className="rounded-full bg-gray-50 border border-gray-100" 
              contentFit="cover" 
            />
            <View className="ml-3 flex-1">
              <Text className="text-gray-950 font-black text-sm" numberOfLines={1}>
                {item.professionalHeadline}
              </Text>
              <Text className="text-gray-400 font-bold text-[11px] mt-0.5" numberOfLines={1}>
                ⚡ {item.skills?.slice(0, 3).join(', ') || 'General Skills'}
              </Text>
              <View className="flex-row mt-2">
                <View className={`px-2 py-0.5 rounded border ${
                  item.isSearchingForJob 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  <Text className={`font-extrabold text-[9px] uppercase tracking-wider ${
                    item.isSearchingForJob ? 'text-emerald-700' : 'text-gray-500'
                  }`}>
                    {item.isSearchingForJob ? 'Active Hunting' : 'Hidden'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => onEdit(item)} 
              className="p-2 bg-blue-50 border border-blue-100 rounded-xl active:bg-blue-100"
            >
              <Ionicons name="create-outline" size={16} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onDelete(item._id)} 
              className="p-2 bg-rose-50 border border-rose-100 rounded-xl active:bg-rose-100"
            >
              <Ionicons name="trash-outline" size={16} color="#E11D48" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
};
