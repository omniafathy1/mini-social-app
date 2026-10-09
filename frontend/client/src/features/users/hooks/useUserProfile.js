// src/features/users/hooks/useUserProfile.js
import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserPosts } from '../api/usersApi';

export function useUserProfile(userId) {
  const profileQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId, // ما نجيبش حاجة لو مفيش userId أصلاً
  });

  const postsQuery = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
  });

  return {
    user: profileQuery.data,
    posts: postsQuery.data || [],
    isLoading: profileQuery.isLoading || postsQuery.isLoading,
    isError: profileQuery.isError || postsQuery.isError,
    error: profileQuery.error || postsQuery.error,
  };
}