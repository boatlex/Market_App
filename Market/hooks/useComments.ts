import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api'; 
import { Comment } from '../types';

interface GetCommentsResponse {
  count: number;
  comments: Comment[];
}

export const useComments = (productId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['comments', productId];

  const { data, isLoading, isError, refetch } = useQuery<GetCommentsResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<GetCommentsResponse>(`/comments/product/${productId}`);
      return data;
    },
    enabled: !!productId,
  });

  // 2. Post a New Top-Level Comment
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ comment: Comment }>(`/comments/${productId}`, { content });
      return data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Post a Reply to an Existing Comment
  const replyToCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data } = await api.post<{ reply: Comment }>(`/comments/reply/${commentId}`, { content });
      return data.reply;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 4. Toggle Like Status (with High-Performance Optimistic UI Updates)
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.patch<{ likesCount: number; isLiked: boolean }>(`/comments/like/${commentId}`);
      return { commentId, ...data };
    },
    onMutate: async (commentId: string) => {
      // Cancel outgoing refetches to avoid overwriting optimistic updates
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the current cache state
      const previousCommentsData = queryClient.getQueryData<GetCommentsResponse>(queryKey);

      // Optimistically modify cache matrix structure
      if (previousCommentsData) {
        // FIXED: Typed list as any[] to correctly handle nested sub-arrays without compiler restrictions
        const updateLikesArray = (list: any[]): any[] => {
          return list.map((comment) => {
            if (comment._id === commentId) {
              const currentUserId = 'CURRENT_USER_ID_FALLBACK'; // Replace with real auth user ID state if available
              const hasLiked = comment.likes.includes(currentUserId);
              return {
                ...comment,
                likes: hasLiked 
                  ? comment.likes.filter((id: string) => id !== currentUserId) 
                  : [...comment.likes, currentUserId]
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: updateLikesArray(comment.replies) };
            }
            return comment;
          });
        };

        queryClient.setQueryData<GetCommentsResponse>(queryKey, {
          ...previousCommentsData,
          comments: updateLikesArray(previousCommentsData.comments),
        });
      }

      return { previousCommentsData };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous state if backend throws an error
      if (context?.previousCommentsData) {
        queryClient.setQueryData(queryKey, context.previousCommentsData);
      }
    },
    onSettled: () => {
      // Sync cache data state definitively with database
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 5. Delete Comment (and cascade-remove associated replies)
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    comments: data?.comments || [],
    totalMainComments: data?.count || 0,
    isLoading,
    isError,
    refetch,

    // Mutation access utilities
    addComment: createCommentMutation.mutate,
    isAddingComment: createCommentMutation.isPending,

    addReply: replyToCommentMutation.mutate,
    isAddingReply: replyToCommentMutation.isPending,

    toggleLike: toggleLikeMutation.mutate,

    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};
