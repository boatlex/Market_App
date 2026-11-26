import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../contexts/authContext";
import { User } from "../types";

interface ConnectionsResponse {
  status?: string;
  followers: User[];
  following: User[];
}

export const useFollow = (profileUserId?: string) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const currentUserId = currentUser?._id || currentUser?.id;
  const targetUserId = profileUserId || currentUserId;

  // 1. Fetch followers & following for the target profile (defaults to logged-in user)
  const {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery<ConnectionsResponse>({
    queryKey: ["user-connections", targetUserId],
    queryFn: async () => {
      const response = await api.get(`/users/${targetUserId}/connections`);
      return response.data;
    },
    enabled: Boolean(targetUserId),
  });

  // 2. Also fetch the logged-in user's own following list when viewing someone else's profile
  const { data: myConnectionsData } = useQuery<ConnectionsResponse>({
    queryKey: ["user-connections", currentUserId],
    queryFn: async () => {
      const response = await api.get(`/users/${currentUserId}/connections`);
      return response.data;
    },
    enabled: Boolean(currentUserId) && String(currentUserId) !== String(targetUserId),
  });

  // 3. Toggle follow / unfollow mutation
  const toggleFollowMutation = useMutation({
    mutationFn: async (userIdToToggle: string) => {
      setTogglingUserId(userIdToToggle);
      const response = await api.post(`/users/${userIdToToggle}/follow`);
      return response.data as {
        status?: string;
        isFollowing: boolean;
        message: string;
      };
    },
    onSuccess: (_data, userIdToToggle) => {
      queryClient.invalidateQueries({ queryKey: ["user-connections", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["user-connections", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["user-connections", userIdToToggle] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onSettled: () => {
      setTogglingUserId(null);
    },
  });

  const followers = data?.followers ?? [];
  const following = data?.following ?? [];

  // Always check against the logged-in user's following list
  const myFollowingList =
    String(currentUserId) === String(targetUserId)
      ? following
      : myConnectionsData?.following ?? [];

  const isFollowingUser = (otherUserId?: string): boolean => {
    if (!otherUserId) return false;
    return myFollowingList.some(
      (u) => String(u._id || u.id) === String(otherUserId)
    );
  };

  return {
    followers,
    following,
    followersCount: followers.length,
    followingCount: following.length,
    isLoading,
    isRefetching,
    isError,
    refetch,
    toggleFollow: toggleFollowMutation.mutate,
    toggleFollowAsync: toggleFollowMutation.mutateAsync,
    isToggling: toggleFollowMutation.isPending,
    togglingUserId,
    isFollowingUser,
  };
};

export default useFollow;
