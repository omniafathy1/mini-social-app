import { useState } from 'react';
import { Heart, MessageCircle, Send, Pencil, Trash2 } from 'lucide-react';
import { usePosts } from '../hooks/usePosts';
import { useComments } from '../../comments/hooks/useComments';
import { useNavigationStore } from '../../../store/navigationStore';
import CommentItem from './CommentItem';

export default function PostItem({ post, currentUserId }) {
  const [commentText, setCommentText] = useState('');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const { toggleLike, updatePost, isUpdating, deletePost, isDeleting } = usePosts();
  const { comments, isLoading, isError, addComment } = useComments(post.id, isCommentsOpen);
  const viewProfile = useNavigationStore((state) => state.viewProfile);

  // الأزرار دي تظهر بس لو انت صاحب البوست فعلاً (فحص شكلي في الفرونت، الحماية الحقيقية في الباك أصلاً)
  const isOwner = post.user?.id === currentUserId;

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment(
      { postId: post.id, content: commentText },
      {
        onSuccess: () => setCommentText(''),
      }
    );
  };

  const handleStartEdit = () => {
    setEditContent(post.content);
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (!trimmed || isUpdating) return;

    updatePost(
      { postId: post.id, content: trimmed },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    // بسيطة كبداية؛ ممكن بعدين نستبدلها بـ modal مخصص بدل confirm() الافتراضية بتاعة المتصفح
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (confirmed) {
      deletePost(post.id);
    }
  };

  return (
    <article className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.06)]">
      <div className="flex items-center justify-between px-5 pt-5">
        <button
          type="button"
          onClick={() => post.user?.id && viewProfile(post.user.id)}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
            {post.user?.avatarUrl ? (
              <img src={post.user.avatarUrl} alt={post.user.name} className="h-full w-full object-cover" />
            ) : (
              (post.user?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 hover:underline">{post.user?.name || 'Unknown user'}</h3>
            <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </button>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="Post options"
              aria-expanded={isMenuOpen}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <span className="text-lg leading-none">•••</span>
            </button>

            {isMenuOpen && (
              <>
                {/* طبقة شفافة بتغطي الشاشة كلها، أي دوسة برة القائمة بتقفلها */}
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <button
                    onClick={handleStartEdit}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="px-5 py-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={handleCancelEdit}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim() || isUpdating}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="px-5 py-5 text-[15px] leading-7 text-slate-700">{post.content}</p>
      )}

      {post.imageUrl && (
        <div className="px-5 pb-5">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="max-h-96 w-full rounded-xl object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><Heart size={14} fill="#2563eb" className="text-blue-600" /> {post.likesCount || 0} likes</span>
        <span>{isCommentsOpen ? `${comments.length} comments` : 'Join the conversation'}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 px-3 py-2">
        <button
          onClick={() => toggleLike({ postId: post.id })}
          className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <Heart size={18} /> Like
        </button>
        <button
          onClick={() => setIsCommentsOpen((isOpen) => !isOpen)}
          aria-expanded={isCommentsOpen}
          className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${isCommentsOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
        >
          <MessageCircle size={18} /> Comments
        </button>
      </div>

      {isCommentsOpen && <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
        {isLoading && <p className="py-4 text-center text-sm text-slate-400">Loading comments...</p>}
        {isError && <p className="py-4 text-center text-sm text-red-500">Could not load comments.</p>}
        {!isLoading && !isError && comments.length === 0 && (
          <p className="py-3 text-center text-sm text-slate-400">No comments yet. Be the first to reply.</p>
        )}
        {!isLoading && !isError && comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} />
        ))}

        <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">M</div>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" aria-label="Send comment" className="rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-700">
            <Send size={16} />
          </button>
        </form>
      </div>}
    </article>
  );
}