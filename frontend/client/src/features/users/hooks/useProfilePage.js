// import { useRef, useState } from 'react';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { useUserProfile } from './useUserProfile';
// import { uploadAvatar, toggleFollow } from '../api/usersApi';
// import { useAuthStore } from '../../auth/store/authStore';

// export function useProfilePage(userId, currentUserId) {
//   const { user, posts, isLoading, isError, error } = useUserProfile(userId);
//   const queryClient = useQueryClient();
//   const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
//   const fileInputRef = useRef(null);
//   const [listModal, setListModal] = useState(null);

//   const isOwnProfile = userId === currentUserId;

//   // 1. Follow Mutation
//   const followMutation = useMutation({
//     mutationFn: () => toggleFollow(userId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['user', userId] });
//     },
//   });

//   // 2. Avatar Mutation
//   const avatarMutation = useMutation({
//     mutationFn: uploadAvatar,
//     onSuccess: (updatedUser) => {
//       queryClient.invalidateQueries({ queryKey: ['user', userId] });
//       if (isOwnProfile) {
//         updateCurrentUser({ avatarUrl: updatedUser.avatarUrl });
//       }
//     },
//   });

//   // Handlers
//   const handleAvatarClick = () => {
//     if (isOwnProfile) fileInputRef.current?.click();
//   };

//   const handleFileChange = (event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     avatarMutation.mutate({ userId, image: file });
//     event.target.value = '';
//   };

//   return {
//     user,
//     posts,
//     isLoading,
//     isError,
//     error,
//     isOwnProfile,
//     fileInputRef,
//     listModal,
//     setListModal,
//     followMutation,
//     avatarMutation,
//     handleAvatarClick,
//     handleFileChange,
//   };
// }