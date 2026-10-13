import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, createPost, toggleLike, updatePost, deletePost } from '../api/postsApi';

export function usePosts() {
  const queryClient = useQueryClient();

  // useInfiniteQuery بيحتفظلنا بكل "الصفحات" اللي جبناها لحد دلوقتي (page 1, page 2, ...)
  // ولما نندهله fetchNextPage، بيجيب الصفحة الجاية ويضيفها على اللي عندنا، مش يستبدلها
  const postsQuery = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) => getPosts(pageParam),

    // بيحدد هل فيه صفحة جاية ولا لأ، وبيرجع رقمها. لو مفيش، بيرجع undefined فيوقف
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined,

    initialPageParam: 1,
  });

  // كل صفحة جاية شكلها { posts: [...], pagination: {...} }
  // بنجمعهم كلهم في array واحدة مسطحة عشان الكومبوننت يستخدمها عادي
  const posts = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];

  // Add a new post.
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Refresh the feed after creating a post.
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Like or unlike a post.
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

  // Edit an existing post.
  const updatePostMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Delete a post.
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

    // متعلقين بالـ "Load more"
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