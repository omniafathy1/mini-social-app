// src/features/users/components/ProfilePage.jsx
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { uploadAvatar, toggleFollow } from '../api/usersApi';
import { useAuthStore } from '../../auth/store/authStore';
import PostItem from '../../posts/components/PostItem';
import FollowListModal from './FollowListModal';

export default function ProfilePage({ userId }) {
  const { user, posts, isLoading, isError, error } = useUserProfile(userId);
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
  const fileInputRef = useRef(null);
  const [listModal, setListModal] = useState(null); // null | 'followers' | 'following'

  const isOwnProfile = userId === currentUserId;

  const followMutation = useMutation({
    mutationFn: () => toggleFollow(userId),
    onSuccess: () => {
      // بعد الـ follow/unfollow، نجيب بيانات اليوزر تاني عشان followersCount و isFollowing يتحدثوا
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      // نحدّث الكاش بتاع react-query عشان الصفحة تتحدث فورًا
      queryClient.invalidateQueries({ queryKey: ['user', userId] });

      // ولو ده البروفايل بتاعنا احنا، نحدّث الـ authStore كمان عشان الـ Navbar وأي مكان تاني يشوف الصورة الجديدة على طول
      if (isOwnProfile) {
        updateCurrentUser({ avatarUrl: updatedUser.avatarUrl });
      }
    },
  });

  const handleAvatarClick = () => {
    if (isOwnProfile) fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    avatarMutation.mutate({ userId, image: file });
    event.target.value = ''; // عشان تقدر تختار نفس الصورة تاني لو عايز
  };

  if (isLoading) {
    return <div className="py-16 text-center text-sm font-medium text-slate-500">Loading profile...</div>;
  }

  if (isError) {
    return <div className="py-16 text-center text-sm text-red-500">We could not load this profile: {error.message}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={!isOwnProfile}
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-2xl font-bold text-white shadow-md shadow-blue-600/20 ${isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || '?'
            )}
          </button>

          {/* أيقونة الكاميرا دي بتظهر بس لو ده بروفايلك انت، تلميح إنك تقدر تدوس تغيّر الصورة */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Camera size={12} />
            </button>
          )}

          {isOwnProfile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black tracking-tight text-slate-950">{user?.name}</h2>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
            </div>

            {!isOwnProfile && (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
                  user?.isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {user?.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-4 text-sm">
            <button onClick={() => setListModal('followers')} className="text-slate-500 hover:underline">
              <span className="font-bold text-slate-900">{user?.followersCount ?? 0}</span> Followers
            </button>
            <button onClick={() => setListModal('following')} className="text-slate-500 hover:underline">
              <span className="font-bold text-slate-900">{user?.followingCount ?? 0}</span> Following
            </button>
          </div>

          {avatarMutation.isPending && <p className="mt-1 text-xs text-blue-500">Uploading photo...</p>}
          {avatarMutation.isError && <p className="mt-1 text-xs text-red-500">Failed to upload photo.</p>}
        </div>
      </div>

      {listModal && (
        <FollowListModal userId={userId} type={listModal} onClose={() => setListModal(null)} />
      )}

      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-lg font-bold text-slate-900">Posts</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <PostItem
            key={post.id}
            post={{ ...post, user: { id: user?.id, name: user?.name, email: user?.email, avatarUrl: user?.avatarUrl } }}
          />
        ))
      )}
    </div>
  );
}