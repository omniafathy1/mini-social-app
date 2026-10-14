// src/features/users/components/FollowListModal.jsx
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getFollowers, getFollowing } from '../api/usersApi';
import { useNavigationStore } from '../../../store/navigationStore';

export default function FollowListModal({ userId, type, onClose }) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: () => (type === 'followers' ? getFollowers(userId) : getFollowing(userId)),
  });

  const viewProfile = useNavigationStore((state) => state.viewProfile);
  const title = type === 'followers' ? 'Followers' : 'Following';

  const handleUserClick = (userId) => {
    viewProfile(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-3">
          {isLoading && <p className="py-6 text-center text-sm text-slate-400">Loading...</p>}

          {!isLoading && users.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          )}

          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleUserClick(user.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <span className="font-medium text-slate-800">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}