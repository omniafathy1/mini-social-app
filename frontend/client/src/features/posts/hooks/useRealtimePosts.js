// src/features/posts/hooks/useRealtimePosts.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../../../socket/socket';

export function useRealtimePosts() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// بوست جديد وصل من أي يوزر تاني → بنضيفه في أول صفحة في الكاش بتاع useInfiniteQuery
		// من غير ما نعمل refetch للسيرفر تاني؛ بنكتب القيمة يدويًا بـ setQueryData
		function handlePostCreated(newPost) {
			queryClient.setQueryData(['posts'], (oldData) => {
				if (!oldData) return oldData; // الفيد لسه متحملش، معندناش حاجة نضيف عليها

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

		// حد عمل لايك على بوست (ممكن يكون انت أو أي حد تاني) → بنحدّث عدد اللايكات بس لنفس البوست ده
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

		// cleanup: لازم نشيل الـ listeners دول لما الـ component يتشال
		// من غيرها، كل مرة الـ component يترسم تاني، هيتضاف listener جديد فوق القديم (memory leak + أحداث مكررة)
		return () => {
			socket.off('post:created', handlePostCreated);
			socket.off('post:liked', handlePostLiked);
		};
	}, [queryClient]);
}