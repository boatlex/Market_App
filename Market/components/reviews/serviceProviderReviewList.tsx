import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image'; // ⚡ Swapped for expo-image to prevent rendering flashes
import { useServiceProviderReviews } from '../../hooks/useServiceProviderReviews';
import { StarRating } from './serviceRatings';
import { ServiceProviderReview } from '../../types';

interface ProviderReviewsListProps {
  providerId: string;
  currentUserId?: string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement 
}

export const ProviderReviewsList: React.FC<ProviderReviewsListProps> = ({ 
  providerId, 
  currentUserId,
  ListHeaderComponent 
}) => {
  const [page, setPage] = useState(1);
  const [accumulatedReviews, setAccumulatedReviews] = useState<ServiceProviderReview[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { reviews, totalPages, isLoading, isError, refetch, deleteReview, isDeletingReview } = 
    useServiceProviderReviews(providerId, page, 10);

  // ⚡ FIXED: Sync local array list state safely on page 1 resets (Mutations/Invalidations)
  useEffect(() => {
    if (page === 1) {
      setAccumulatedReviews(reviews);
    } else if (reviews.length > 0) {
      setAccumulatedReviews((prev) => {
        const existingIds = new Set(prev.map(r => r._id));
        const uniqueNewReviews = reviews.filter(r => !existingIds.has(r._id));
        return [...prev, ...uniqueNewReviews];
      });
    }
  }, [reviews, page]);

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await refetch();
    setIsRefreshing(false);
  };

  const handleDelete = (reviewId: string) => {
    deleteReview(reviewId, {
      onSuccess: () => {
        setAccumulatedReviews((prev) => prev.filter((r) => r._id !== reviewId));
      }
    });
  };

  const renderReviewItem = ({ item }: { item: ServiceProviderReview }) => {
    const reviewerObj = typeof item.reviewer === 'object' ? item.reviewer : null;
    const reviewerName = reviewerObj ? `${reviewerObj.firstName} ${reviewerObj.lastName}` : 'Anonymous Customer';
    // Clean fallback to a styled UI placeholder vector instead of breaking links
    const reviewerPic = reviewerObj?.profilePicture || null;
    const isOwner = reviewerObj?._id === currentUserId || (typeof item.reviewer === 'string' && item.reviewer === currentUserId);

    return (
      <View className="bg-white border-b border-gray-100 p-4 flex-row items-start mx-2">
        {reviewerPic ? (
          <Image source={{ uri: reviewerPic }} style={{ width: 40, height: 40 }} className="rounded-full bg-gray-100 mr-3" contentFit="cover" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
            <Text className="text-orange-600 font-bold text-sm">{reviewerName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-gray-800 font-semibold text-base">{reviewerName}</Text>
              <StarRating rating={item.rating} isReadOnly size={14} className="mt-0.5" />
            </View>
            <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          {item.comment && <Text className="text-gray-600 mt-2 text-sm leading-relaxed">{item.comment}</Text>}
          {isOwner && (
            <Pressable onPress={() => handleDelete(item._id)} disabled={isDeletingReview} className="self-end mt-2 px-2 py-1 active:opacity-50">
              <Text className="text-red-500 font-medium text-xs">{isDeletingReview ? 'Removing...' : 'Delete'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={accumulatedReviews}
      keyExtractor={(item) => item._id}
      renderItem={renderReviewItem}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={ListHeaderComponent} 
      ListFooterComponent={() => page < totalPages ? <View className="py-6"><ActivityIndicator size="small" color="#F97316" /></View> : null}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#F97316']} />}
      ListEmptyComponent={() => (
        <View className="py-12 items-center justify-center bg-white">
          <Text className="text-gray-400 text-base">No reviews posted yet.</Text>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 140 }}
      className="flex-1 bg-white"
    />
  );
};



// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, Image, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
// import { useServiceProviderReviews } from '../../hooks/useServiceProviderReviews';
// import { StarRating } from './serviceRatings';
// import { ServiceProviderReview } from '../../types';

// interface ProviderReviewsListProps {
//   providerId: string;
//   currentUserId?: string;
//   ListHeaderComponent?: React.ComponentType<any> | React.ReactElement 
// }

// export const ProviderReviewsList: React.FC<ProviderReviewsListProps> = ({ 
//   providerId, 
//   currentUserId,
//   ListHeaderComponent 
// }) => {
//   const [page, setPage] = useState(1);
//   const [accumulatedReviews, setAccumulatedReviews] = useState<ServiceProviderReview[]>([]);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const { reviews, totalPages, isLoading, isError, refetch, deleteReview, isDeletingReview } = 
//     useServiceProviderReviews(providerId, page, 10);

//   useEffect(() => {
//     if (reviews.length > 0) {
//       if (page === 1) {
//         setAccumulatedReviews(reviews);
//       } else {
//         setAccumulatedReviews((prev) => {
//           const existingIds = new Set(prev.map(r => r._id));
//           const uniqueNewReviews = reviews.filter(r => !existingIds.has(r._id));
//           return [...prev, ...uniqueNewReviews];
//         });
//       }
//     } else if (page === 1 && reviews.length === 0) {
//       setAccumulatedReviews([]);
//     }
//   }, [reviews, page]);

//   const handleLoadMore = () => {
//     if (page < totalPages && !isLoading) {
//       setPage((prevPage) => prevPage + 1);
//     }
//   };

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     setPage(1);
//     await refetch();
//     setIsRefreshing(false);
//   };

//   const handleDelete = (reviewId: string) => {
//     deleteReview(reviewId, {
//       onSuccess: () => {
//         setAccumulatedReviews((prev) => prev.filter((r) => r._id !== reviewId));
//       }
//     });
//   };

//   const renderReviewItem = ({ item }: { item: ServiceProviderReview }) => {
//     const reviewerObj = typeof item.reviewer === 'object' ? item.reviewer : null;
//     const reviewerName = reviewerObj ? `${reviewerObj.firstName} ${reviewerObj.lastName}` : 'Anonymous Customer';
//     const reviewerPic = reviewerObj?.profilePicture || 'https://placeholder.com';
//     const isOwner = reviewerObj?._id === currentUserId || (typeof item.reviewer === 'string' && item.reviewer === currentUserId);

//     return (
//       <View className="bg-white border-b border-gray-100 p-4 flex-row items-start mx-2">
//         <Image source={{ uri: reviewerPic }} className="w-10 h-10 rounded-full bg-gray-100 mr-3" />
//         <View className="flex-1">
//           <View className="flex-row justify-between items-start">
//             <View>
//               <Text className="text-gray-800 font-semibold text-base">{reviewerName}</Text>
//               <StarRating rating={item.rating} isReadOnly size={14} className="mt-0.5" />
//             </View>
//             <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
//           </View>
//           {item.comment && <Text className="text-gray-600 mt-2 text-sm leading-relaxed">{item.comment}</Text>}
//           {isOwner && (
//             <Pressable onPress={() => handleDelete(item._id)} disabled={isDeletingReview} className="self-end mt-2 px-2 py-1 active:opacity-50">
//               <Text className="text-red-500 font-medium text-xs">{isDeletingReview ? 'Removing...' : 'Delete'}</Text>
//             </Pressable>
//           )}
//         </View>
//       </View>
//     );
//   };

//   return (
//     <FlatList
//       data={accumulatedReviews}
//       keyExtractor={(item) => item._id}
//       renderItem={renderReviewItem}
//       onEndReached={handleLoadMore}
//       onEndReachedThreshold={0.3}
//       ListHeaderComponent={ListHeaderComponent} 
//       ListFooterComponent={() => page < totalPages ? <View className="py-6"><ActivityIndicator size="small" color="#3B82F6" /></View> : null}
//       refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#3B82F6']} />}
//       ListEmptyComponent={() => (
//         <View className="py-12 items-center justify-center bg-white">
//           <Text className="text-gray-400 text-base">No reviews posted yet.</Text>
//         </View>
//       )}
//       contentContainerStyle={{ paddingBottom: 140 }}
//       className="flex-1 bg-white"
//     />
//   );
// };
