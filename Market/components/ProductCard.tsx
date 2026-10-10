import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32; // Matches flatlist container padding parameters

export const ProductCard = ({ item, onPress }: ProductCardProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const activeIndex = Math.floor((offset + slideSize / 2) / slideSize);
    setActiveImageIndex(activeIndex);
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm"
      style={{ width: CARD_WIDTH }}
    >
      {/* IMAGE TRACK CAROUSEL */}
      <View className="relative h-48 bg-gray-100">
        {item.images && item.images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {item.images.map((imgUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imgUrl }}
                  className="h-48"
                  style={{ width: CARD_WIDTH }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* DOT INDICATORS OVERLAY */}
            {item.images.length > 1 && (
              <View className="absolute bottom-3 left-0 right-0 flex-row justify-center space-x-1.5">
                {item.images.map((_, index) => (
                  <View
                    key={index}
                    className={`h-1.5 rounded-full ${index === activeImageIndex ? 'w-4 bg-green-600' : 'w-1.5 bg-white/60'}`}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-200">
            <Ionicons name="image-outline" size={40} color="#888" />
          </View>
        )}

        {/* CONDITION BADGE OVERLAY */}
        {item.condition && (
          <View className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-md">
            <Text className="text-white text-xs font-semibold">{item.condition}</Text>
          </View>
        )}
      </View>

      {/* BODY METADATA DETAILED PANELS */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="font-bold text-lg text-gray-900 flex-1 numberOfLines={1}">
            {item.name}
          </Text>
          <Text className="text-green-600 font-extrabold text-lg ml-2">
            GHS {item.price.toLocaleString()}
          </Text>
        </View>

        <Text className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">
          {item.category} • {item.productType}
        </Text>

        <Text className="text-gray-600 text-sm mb-3 numberOfLines={2}" style={{ lineHeight: 20 }}>
          {item.description}
        </Text>

        {/* BOTTOM METRIC REGION FOOTER */}
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
              {item.location || item.district}, {item.region}
            </Text>
          </View>
          
          <Text className="text-gray-400 text-[10px]">
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
