import { useState } from 'react';
import { CornerUpLeft, Heart, Send } from 'lucide-react';
import { useComments } from '../../comments/hooks/useComments';
import { useNavigationStore } from '../../../store/navigationStore';

export default function CommentItem({ comment }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { addReply, toggleLike } = useComments();
  const viewProfile = useNavigationStore((state) => state.viewProfile);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    // The API derives the user ID from the authenticated token.
    addReply(
      { commentId: comment.id, content: replyContent },
      {
        onSuccess: () => {
          setReplyContent('');
          setIsReplying(false);
        },
      }
    );
  };

  return (
    <div className="my-2 flex gap-2 text-sm">
      <button
        type="button"
        onClick={() => comment.user?.id && viewProfile(comment.user.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-bold text-slate-600"
      >
        {comment.user?.avatarUrl ? (
          <img src={comment.user.avatarUrl} alt={comment.user.name} className="h-full w-full object-cover" />
        ) : (
          (comment.user?.name || 'U').charAt(0).toUpperCase()
        )}
      </button>
      <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => comment.user?.id && viewProfile(comment.user.id)}
            className="font-semibold text-slate-800 hover:underline"
          >
            {comment.user?.name || 'User'}
          </button>
          <span className="text-xs text-slate-400">
          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      
        <p className="mt-1 text-slate-700">{comment.content}</p>

        <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
        <button 
          onClick={() => toggleLike({ commentId: comment.id })}
          className="flex items-center gap-1 transition hover:text-blue-600"
        >
          <Heart size={14} /> Like
        </button>
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center gap-1 transition hover:text-blue-600"
        >
          <CornerUpLeft size={14} /> Reply
        </button>
        </div>

      {isReplying && (
        <form onSubmit={handleSendReply} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
          />
          <button 
            type="submit"
            aria-label="Send reply"
            className="rounded-full bg-blue-500 p-2 text-white transition hover:bg-blue-600"
          >
            <Send size={14} />
          </button>
        </form>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <button
                type="button"
                onClick={() => reply.user?.id && viewProfile(reply.user.id)}
                className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-bold text-slate-600"
              >
                {reply.user?.avatarUrl ? (
                  <img src={reply.user.avatarUrl} alt={reply.user.name} className="h-full w-full object-cover" />
                ) : (
                  (reply.user?.name || 'U').charAt(0).toUpperCase()
                )}
              </button>
              <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => reply.user?.id && viewProfile(reply.user.id)}
                    className="text-xs font-semibold text-slate-800 hover:underline"
                  >
                    {reply.user?.name || 'User'}
                  </button>
                  <span className="text-[10px] text-slate-400">
                    {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}