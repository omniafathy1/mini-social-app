import { usePosts } from '../hooks/usePosts';
import CreatePost from './CreatePost';
import PostItem from './PostItem';

export default function PostList() {
  const {
    posts,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePosts();

  if (isLoading) {
    return <div className="py-16 text-center text-sm font-medium text-slate-500">Loading your feed...</div>;
  }

  if (isError) {
    return <div className="py-16 text-center text-sm text-red-500">We could not load your feed: {error.message}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-blue-600">Your community</p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Latest posts</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">{posts.length} posts</span>
      </div>

      <CreatePost />
      
      {posts.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">No posts yet. Start the conversation.</p>
      ) : (
        posts.map((post) => (
          <PostItem 
            key={post.id} 
            post={post} 
          />
        ))
      )}

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}