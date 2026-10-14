// src/features/posts/hooks/useRealtimePosts.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../../../socket/socket';

export function useRealtimePosts() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Insert new posts into the cached infinite feed without refetching.
		function handlePostCreated(newPost) {
			queryClient.setQueryData(['posts'], (oldData) => {
				if (!oldData) return oldData;

				const [firstPage, ...restPages] = oldData.pages;
				const updatedFirstPage = {
					...firstPage,
					posts: [newPost, ...firstPage.posts],
				};

				return {
					...oldData,
					pages: [updatedFirstPage, ...restPages],
				};
			});
		}

		// Keep like counts synchronized in feed and profile caches.
		function handlePostLiked({ postId, likesCount }) {
			queryClient.setQueryData(['posts'], (oldData) => {
				if (!oldData) return oldData;

				return {
					...oldData,
					pages: oldData.pages.map((page) => ({
						...page,
						posts: page.posts.map((post) =>
							post.id === postId ? { ...post, likesCount } : post
						),
					})),
				};
			});

			queryClient.setQueriesData({ queryKey: ['userPosts'] }, (oldPosts) =>
				oldPosts?.map((post) =>
					post.id === postId ? { ...post, likesCount } : post
				)
			);
		}

		socket.on('post:created', handlePostCreated);
		socket.on('post:liked', handlePostLiked);

		// Remove listeners when the hook unmounts to prevent duplicate events.
		return () => {
			socket.off('post:created', handlePostCreated);
			socket.off('post:liked', handlePostLiked);
		};
	}, [queryClient]);
}