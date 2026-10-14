import { axiosClient } from '../../../api/axiosClient';

export const getComments = async (postId) => {
  const { data } = await axiosClient.get(`/posts/${postId}/comments`);
  return data.comments;
};

// Add a comment to a post.
// The backend derives the user ID from the authorization token.
export const addComment = async ({ postId, content }) => {
  const { data } = await axiosClient.post(`/posts/${postId}/comments`, { content });
  return data;
};

// Reply to an existing comment.
export const addReply = async ({ commentId, content }) => {
  const { data } = await axiosClient.post(`/comments/${commentId}/replies`, { content });
  return data;
};

// Like or unlike a comment.
export const toggleCommentLike = async ({ commentId }) => {
  const { data } = await axiosClient.post(`/comments/${commentId}/like`);
  return data;
};