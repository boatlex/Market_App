import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
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
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [replyToContext, setReplyToContext] = useState<Comment | null>(null);
  const router = useRouter();

  const handleOpenCommentModal = () => {
    if (!user) {
      router.push("/(auth)");
      return;
    }
    setReplyToContext(null);
    setIsCommentModalVisible(true);
  };

  const handleOpenReplyModal = (item: Comment) => {
    if (!user) {
      router.push("/(auth)");
      return;
    }
    setReplyToContext(item);
    setIsCommentModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsCommentModalVisible(false);
    setCommentText('');
    setReplyToContext(null);
  };

  const handlePostSubmit = () => {
    if (!commentText.trim()) return;

    if (replyToContext) {
      addReply(
        { commentId: replyToContext._id, content: commentText.trim() },
        {
          onSuccess: () => handleCloseModal(),
        }
      );
    } else {
      addComment(commentText.trim(), {
        onSuccess: () => handleCloseModal(),
      });
    }
  };

  // Recursive Comment Node Component to cleanly indent replies
  const CommentNode = ({ item, isReply = false }: { item: Comment; isReply?: boolean }) => {
    const commentUser = item.user as User;
    const fallbackInitial = commentUser?.firstName ? commentUser.firstName.charAt(0) : 'U';
    const isLikedByMe = item.likes.includes(user?.id || '');
    const isMyComment = user?.id === commentUser?._id;

    return (
      <View className={`mt-4 ${isReply ? 'pl-5 border-l-2 border-gray-100 ml-2' : ''}`}>
        <View className="flex-row items-start justify-between">
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
              
              <View className="flex-row items-center gap-4 mt-2">
                <TouchableOpacity onPress={() => toggleLike(item._id)} className="flex-row items-center gap-1">
                  <Ionicons name={isLikedByMe ? "heart" : "heart-outline"} size={14} color={isLikedByMe ? "#EF4444" : "#6B7280"} />
                  <Text className={`text-xs ${isLikedByMe ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {item.likes.length}
                  </Text>
                </TouchableOpacity>

                {!isReply && (
                  <TouchableOpacity 
                    onPress={() => handleOpenReplyModal(item)} 
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

  const isSubmitting = isAddingComment || isAddingReply;
  const targetUser = replyToContext?.user as User;
  const targetName = targetUser?.firstName || 'user';

  return (
    <View className="bg-white">
      <View className="py-3 border-b border-gray-100 flex-row justify-between items-center">
        <Text className="text-sm font-semibold text-gray-800">
          Comments ({totalMainComments || 0})
        </Text>
      </View>

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

      {/* Trigger Button Interface (Launches Modal) */}
      <TouchableOpacity 
        onPress={handleOpenCommentModal}
        className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-sm text-gray-400 flex-1">Write a comment...</Text>
        <Ionicons name="send" size={16} color="#3B82F6" />
      </TouchableOpacity>

      {/* 🚀 Main Comment / Reply Input Modal Layer */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="absolute inset-0 bg-black/40" />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View className="bg-white rounded-t-3xl p-5 w-full">
            {/* Top Modal Nav Bar Header */}
            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
              <TouchableOpacity onPress={handleCloseModal}>
                <Text className="text-gray-500 font-medium">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-base font-bold text-gray-800">
                {replyToContext ? 'New Reply' : 'New Comment'}
              </Text>
              <TouchableOpacity 
                onPress={handlePostSubmit}
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text className={`font-bold ${commentText.trim() ? 'text-blue-600' : 'text-blue-300'}`}>Post</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Contextual Quote Header for Replies */}
            {replyToContext && (
              <View className="mt-3 bg-gray-50 border-l-4 border-blue-500 p-2.5 rounded-r-xl">
                <Text className="text-xs font-bold text-blue-600 mb-0.5">
                  Replying to @{targetName}
                </Text>
                <Text className="text-xs text-gray-500" numberOfLines={2}>
                  {replyToContext.content}
                </Text>
              </View>
            )}

            {/* Text Input Container Frame */}
            <View className="py-4">
              <TextInput
                placeholder={replyToContext ? `Write your reply...` : "Share your thoughts about this item..."}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={4}
                maxLength={500}
                autoFocus={true}
                className="text-base text-gray-800 text-start min-h-[120px] max-h-[200px] bg-gray-50 p-3 rounded-xl border border-gray-100"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-right text-xs text-gray-400 mt-1">{commentText.length}/500</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
