import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, createPost, toggleLike, updatePost, deletePost } from '../api/postsApi';

export function usePosts() {
  const queryClient = useQueryClient();

  const postsQuery = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) => getPosts(pageParam),

    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined,

    initialPageParam: 1,
  });

  const posts = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onMutate: async ({ postId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['posts'] }),
        queryClient.cancelQueries({ queryKey: ['userPosts'] }),
      ]);

      const previousPosts = queryClient.getQueryData(['posts']);
      const previousUserPosts = queryClient.getQueriesData({ queryKey: ['userPosts'] });
      const updatePost = (post) => {
        if (post.id !== postId) return post;

        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likesCount: Math.max(0, (post.likesCount || 0) + (isLiked ? 1 : -1)),
        };
      };

      queryClient.setQueryData(['posts'], (old) => old && ({
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map(updatePost),
        })),
      }));
      queryClient.setQueriesData({ queryKey: ['userPosts'] }, (old) =>
        old && old.map(updatePost)
      );

      return { previousPosts, previousUserPosts };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(['posts'], context.previousPosts);
      context.previousUserPosts.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    posts,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,

    fetchNextPage: postsQuery.fetchNextPage,
    hasNextPage: postsQuery.hasNextPage,
    isFetchingNextPage: postsQuery.isFetchingNextPage,

    createPost: createPostMutation.mutate,
    isCreating: createPostMutation.isPending,
    toggleLike: likeMutation.mutate,

    updatePost: updatePostMutation.mutate,
    isUpdating: updatePostMutation.isPending,

    deletePost: deletePostMutation.mutate,
    isDeleting: deletePostMutation.isPending,
  };
}