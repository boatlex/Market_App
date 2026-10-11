import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import SafeScreen from '../../components/SafeScreen';
import Header from '../../components/Header';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/authContext'; 
import { api } from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

const MyAddsScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', 'my-listings'],
    queryFn: async () => {
      const response = await api.get('/products/user');
      return response.data; 
    }
  });

  
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      alert("Listing deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['products', 'my-listings'] });
    },
    onError: (error: any) => {
      console.error("Delete failed:", error);
      alert("Failed to delete item. Please try again.");
    }
  });

  const handleEditPress = (product: any) => {
    router.push({
      pathname: '/sell',
      params: { productData: JSON.stringify(product) }
    });
  };

  const handleDeletePress = (productId: string) => {
    if (confirm("Are you sure you want to permanently delete this listing?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const renderProductCard = ({ item }: { item: any }) => {
    const fallbackImage = "https://placeholder.com";
    const primaryImage = item.images && item.images.length > 0 ? item.images[0] : fallbackImage;

    return (
      <View className="flex-row bg-white border
       border-gray-100 rounded-2xl p-3 mb-4 shadow-sm items-center">
        <Image 
          source={{ uri: primaryImage }} 
          className="w-20 h-20 rounded-xl bg-gray-100 object-cover"
        />

        {/* Product Meta details metadata info */}
        <View className="flex-1 ml-4 justify-between">
          <View>
            <Text className="text-black font-bold text-base numberOfLines={1}">
              {item.name}
            </Text>
            <Text className="text-blue-600 font-extrabold text-sm mt-1">
              GHS {parseFloat(item.price).toFixed(2)}
            </Text>
          </View>
          
          <View className="flex-row items-center mt-2">
            <Ionicons 
              name={item.isAvailable ? "ellipse" : "ellipse-outline"} 
              size={10} 
              color={item.isAvailable ? "#16a34a" : "#dc2626"} 
            />
            <Text className="text-[11px] text-gray-500 font-medium ml-1">
              {item.isAvailable ? "Active Ad" : "Sold / Invisible"}
            </Text>
          </View>
        </View>

        {/* Interactive Action Control Bars Buttons */}
        <View className="flex-row space-x-2 border-l border-gray-100 pl-3">
          {/* Edit Trigger Button */}
          <TouchableOpacity 
            onPress={() => handleEditPress(item)}
            className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center border border-blue-100"
          >
            <Ionicons name="create-outline" size={18} color="#2563eb" />
          </TouchableOpacity>

          {/* Permanent Database Delete Trigger Button */}
          <TouchableOpacity 
            onPress={() => handleDeletePress(item._id)}
            className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center border border-red-100"
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeScreen>
      <Header title='My Adds' />
      
      <View className="flex-1 px-4 pt-4 bg-gray-50/50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 text-sm font-medium mt-2">Loading your ads...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-6 text-center">
            <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-700 font-bold text-base mt-4">Failed to synchronize catalog</Text>
            <TouchableOpacity 
              onPress={() => refetch()}
              className="mt-3 px-4 py-2 bg-blue-600 rounded-lg"
            >
              <Text className="text-white font-semibold">Retry Fetch</Text>
            </TouchableOpacity>
          </View>
        ) : data?.products?.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 text-center">
            <Ionicons name="file-tray-stacked-outline" size={54} color="#9ca3af" />
            <Text className="text-gray-800 font-bold text-lg mt-4">No active ads published</Text>
            <Text className="text-gray-500 text-sm mt-1">Items you publish for sale will show up right here.</Text>
            <TouchableOpacity 
              onPress={() => router.push('/sell')}
              className="mt-5 px-6 py-3 bg-blue-600 rounded-xl shadow-sm shadow-blue-500/20"
            >
              <Text className="text-white font-bold text-base">Create an Ad Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={data?.products || []}
            keyExtractor={(item) => item._id}
            renderItem={renderProductCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        )}
      </View>
    </SafeScreen>
  );
};

export default MyAddsScreen;
