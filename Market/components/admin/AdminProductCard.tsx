import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';

interface AdminProductCardProps {
  product: Product;
  onDelete: (productId: string) => void;
  isDeleting: boolean;
}

export default function AdminProductCard({
  product,
  onDelete,
  isDeleting,
}: AdminProductCardProps) {
  const sellerName =
    typeof product.seller === 'object' && product.seller !== null
      ? `${product.seller.firstName} ${product.seller.lastName}`
      : 'Seller';

  const thumbnailUri =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : 'https://placeholder.com';

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to permanently delete "${product.name}"? This will also remove its images and comments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(product._id),
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center bg-white rounded-2xl p-3 mb-2.5 border border-gray-200 gap-3">
      <Image
        source={{ uri: thumbnailUri }}
        className="w-14 h-14 rounded-xl bg-gray-100"
      />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs font-bold text-emerald-600 mt-0.5">
          GHS {product.price.toLocaleString()}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {product.category} • By {sellerName}
        </Text>
      </View>
      <TouchableOpacity
        className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
        disabled={isDeleting}
        onPress={handleConfirmDelete}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : (
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        )}
      </TouchableOpacity>
    </View>
  );
}
