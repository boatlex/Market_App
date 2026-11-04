import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../contexts/authContext';
import { capitalizeFirstLetter } from '../../lib/utils';
import { Comment, User } from '../../types';
import { useRouter } from 'expo-router';


interface ProductCommentsProps {
  productId: string;
}

export default function ProductComments({ productId }: ProductCommentsProps) {
  const { user } = useAuth();
  const { 
    comments, 
    totalMainComments, 
    isLoading, 
    addComment, 
    isAddingComment, 
    addReply, 
    isAddingReply,
    toggleLike,
    deleteComment
  } = useComments(productId);

  const [commentText, setCommentText] = useState('');
  const [replyToContext, setReplyToContext] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
 const router = useRouter()

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    if(!user){
        router.push("/(auth)")
    }
    addComment(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    });
  };

  const handlePostReply = () => {
    if (!replyText.trim() || !replyToContext) return;
    addReply(
      { commentId: replyToContext._id, content: replyText.trim() },
      {
        onSuccess: () => {
          setReplyText('');
          setReplyToContext(null);
        },
      }
    );
  };

  // Recursive Comment Node Component to cleanly indent replies
  const CommentNode = ({ item, isReply = false }: { item: Comment; isReply?: boolean }) => {
    const commentUser = item.user as User;

    const fallbackInitial = commentUser?.firstName ? commentUser.firstName.charAt(0) : 'U';
    const isLikedByMe = item.likes.includes(user?.id || '');
    const isMyComment = user?.id === commentUser?._id;
    
    
    const isReplyingToThis = replyToContext?._id === item._id;

    return (
      <View className={`mt-4 ${isReply ? 'pl-5 border-l-2 border-gray-100 ml-2' : ''}`}>
        <View className="flex-row items-start justify-between">
          {/* Left Layer: User details */}
          <View className="flex-row items-start flex-1 mr-2">
            <View className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 items-center justify-center mr-3">
              {commentUser?.profilePicture ? (
                <Image source={{ uri: commentUser.profilePicture }} className="w-full h-full" />
              ) : (
                <Text className="text-blue-600 font-bold text-xs">{capitalizeFirstLetter(fallbackInitial)}</Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-900">
                {`${commentUser?.firstName || ''} ${commentUser?.lastName || ''}`.trim() || 'Anonymous'}
              </Text>
              <Text className="text-sm text-gray-700 mt-1">{item.content}</Text>
              
              {/* Context Actions Block */}
              <View className="flex-row items-center gap-4 mt-2">
                <TouchableOpacity onPress={() => toggleLike(item._id)} className="flex-row items-center gap-1">
                  <Ionicons name={isLikedByMe ? "heart" : "heart-outline"} size={14} color={isLikedByMe ? "#EF4444" : "#6B7280"} />
                  <Text className={`text-xs ${isLikedByMe ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {item.likes.length}
                  </Text>
                </TouchableOpacity>

                {!isReply && (
                  <TouchableOpacity 
                    onPress={() => {
                      setReplyText(''); // Clear any stale text before opening a new reply box
                      setReplyToContext(item);
                    }} 
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons name="chatbubble-outline" size={13} color="#6B7280" />
                    <Text className="text-xs text-gray-500">Reply</Text>
                  </TouchableOpacity>
                )}

                {isMyComment && (
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert("Delete", "Are you sure you want to remove this comment?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteComment(item._id) }
                      ]);
                    }}
                  >
                    <Text className="text-xs text-red-500">Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Inline Reply Form Layer */}
        {isReplyingToThis && (
          <View className="mt-3 ml-2 flex-row items-center bg-gray-50 rounded-lg p-2 border border-gray-200">
            <TextInput
              placeholder={`Reply to ${commentUser?.firstName || 'user'}...`}
              value={replyText}
              onChangeText={setReplyText}
              className="flex-1 text-sm text-gray-800 p-1"
              autoFocus
            />
            <TouchableOpacity onPress={() => setReplyToContext(null)} className="mx-2">
              <Text className="text-xs text-gray-400">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handlePostReply}
              disabled={isAddingReply || !replyText.trim()}
              className="bg-blue-600 px-3 py-1.5 rounded-md disabled:bg-blue-300"
            >
              {isAddingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-xs font-bold text-white">Post</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Recursive rendering layer for nested replies */}
        {(item as any).replies && (item as any).replies.length > 0 && (
          <View>
            {(item as any).replies.map((reply: any) => (
              <CommentNode key={reply._id} item={reply} isReply={true} />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="justify-center items-center py-6">
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="bg-white">
      {/* Thread Title Details */}
      <View className="py-3 border-b border-gray-100 flex-row justify-between items-center">
        <Text className="text-sm font-semibold text-gray-800">
          Comments ({totalMainComments || 0})
        </Text>
      </View>

      {/* Main Thread Content Container - Uses mapping to fit perfectly inside the parent ScrollView */}
      <View className="pb-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentNode key={comment._id} item={comment} />
          ))
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-sm text-gray-400">No comments yet. Be the first to say something!</Text>
          </View>
        )}
      </View>

      {/* Persistent Input Layout for new main comments */}
      {!replyToContext && (
        <View className="mt-2 pt-3 border-t border-gray-100 flex-row items-center bg-white">
          <TextInput
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 mr-3 max-h-20"
          />
          <TouchableOpacity 
            onPress={handlePostComment}
            disabled={isAddingComment || !commentText.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 justify-center items-center disabled:bg-blue-300"
          >
            {isAddingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
