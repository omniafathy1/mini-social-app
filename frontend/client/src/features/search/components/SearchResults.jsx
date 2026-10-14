import React from 'react';
import { useNavigationStore } from '../../../store/navigationStore';
import { getSnippet } from '../utils/searchText';

export const SearchResults = ({ data, isLoading, isError, searchTerm }) => {
  const viewProfile = useNavigationStore((state) => state.viewProfile);

  if (isLoading) return <div className="text-center text-gray-400 py-6">جاري البحث... ⏳</div>;
  if (isError) return <div className="text-center text-red-400 py-6">حدث خطأ أثناء البحث. حاول مرة أخرى.</div>;
  if (!data) return null;

  const { posts = [], users = [] } = data;
  const isEmpty = posts.length === 0 && users.length === 0;

  if (isEmpty) return <div className="text-center text-gray-500 py-6">لا توجد نتائج مطابقة لبحثك.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {users.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">
            المستخدمين ({users.length})
          </h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => viewProfile(user.id)}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition shadow-sm"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-white font-medium hover:underline">{user.name}</h4>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">
            البوستات ({posts.length})
          </h3>
          <div className="space-y-3">
            {posts.map((post, index) => {
              const displayContent = searchTerm ? getSnippet(post.content, searchTerm) : post.content;

              return (
                <div key={post.id || index} className="p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-400">
                    <span
                      onClick={() => post.author?.id && viewProfile(post.author.id)}
                      className="font-semibold text-white hover:underline cursor-pointer"
                    >
                      {post.author?.name || 'مستخدم مجهول'}
                    </span>
                    <span>•</span>
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('ar-EG') : ''}</span>
                  </div>
                  <p className="text-gray-200">{displayContent}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};