import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image'; // OPTIMIZATION: Replacing react-native Image for smoother caching & performance
import { Product } from '../types';

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  // Optional parameters if you decide to pass generic handlers up to your screens later
  isInitiallyFavorite?: boolean;
  onFavoriteToggle?: (productId: string, isFav: boolean) => void;
}

interface ProductGridProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// 2-Column Grid Layout Calculations
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING * 2) - GAP) / 2;

// 1. INDIVIDUAL GRID ITEM COMPONENT
export const ProductCard = ({ item, onPress, isInitiallyFavorite = false, onFavoriteToggle }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(isInitiallyFavorite);
  const displayImage = item.images && item.images.length > 0 ? item.images[0] : null;

  const handleFavoritePress = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    if (onFavoriteToggle && item._id) {
      onFavoriteToggle(item._id, nextState);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-3 shadow-sm relative"
      style={{ width: CARD_WIDTH }}
    >
      {/* IMAGE TRACK CONTAINER */}
      <View className="relative h-36 bg-gray-100">
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            style={{ width: '100%', height: 144 }}
            contentFit="cover"
            transition={200} // Smooth image fade-in transition
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-200">
            <Ionicons name="image-outline" size={32} color="#888" />
          </View>
        )}

        {/* CONDITION BADGE OVERLAY */}
        {item.condition && (
          <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded z-10">
            <Text className="text-white text-[10px] font-semibold">{item.condition}</Text>
          </View>
        )}

        {/* ADDED: FLOATING FAVORITE BUTTON OVERLAY */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFavoritePress}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md items-center justify-center z-10 shadow-sm"
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={18} 
            color={isFavorite ? "#EF4444" : "#4B5563"} 
          />
        </TouchableOpacity>
      </View>

      {/* BODY METADATA DETAILED PANELS */}
      <View className="p-3">
        <Text numberOfLines={1} className="font-bold text-sm text-gray-900 mb-0.5">
          {item.name}
        </Text>
        
        <Text className="text-green-600 font-extrabold text-sm mb-1">
          GHS {item.price.toLocaleString()}
        </Text>

        <Text numberOfLines={1} className="text-gray-500 text-[10px] font-medium mb-1 uppercase tracking-wide">
          {item.category} • {item.productType}
        </Text>

        {/* BOTTOM METRIC REGION FOOTER */}
        <View className="flex-row justify-between items-center pt-2 border-t border-gray-50 mt-1">
          <View className="flex-row items-center flex-1 mr-1">
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text className="text-gray-500 text-[10px] ml-0.5 flex-1" numberOfLines={1}>
              {item.location || item.district}
            </Text>
          </View>
          
          <Text className="text-gray-400 text-[9px] shrink-0">
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 2. MAIN FLATLIST COMPONENT
export const ProductGrid = ({ products, onProductPress, onRefresh, refreshing = false }: ProductGridProps) => {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id || item.name}
      renderItem={({ item }) => (
        <ProductCard 
          item={item} 
          onPress={() => onProductPress && onProductPress(item)} 
        />
      )}
      // Grid Props
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      contentContainerStyle={{ paddingHorizontal: PADDING, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      
      // Pull to Refresh (Optional configuration)
      onRefresh={onRefresh}
      refreshing={refreshing}

      // Performance optimizations for rapid image scrolling
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};
