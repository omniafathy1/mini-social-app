import { axiosClient } from '../../../api/axiosClient';

export const getPosts = async (page = 1, limit = 10) => {
  const { data } = await axiosClient.get('/posts', { params: { page, limit } });
  return data; // { posts, pagination }
};

export const createPost = async (postData) => {
  if (!postData.image) {
    const { data } = await axiosClient.post('/posts', { content: postData.content });
    return data;
  }

  const formData = new FormData();
  formData.append('content', postData.content);
  formData.append('image', postData.image);

  const { data } = await axiosClient.post('/posts', formData, {
    // Let the browser set the multipart content type and boundary.
    headers: { 'Content-Type': undefined },
  });
  return data;
};

export const toggleLike = async ({ postId }) => {
  const { data } = await axiosClient.post(`/posts/${postId}/like`);
  return data;
};

export const updatePost = async ({ postId, content }) => {
  const { data } = await axiosClient.put(`/posts/${postId}`, { content });
  return data;
};

export const deletePost = async (postId) => {
  const { data } = await axiosClient.delete(`/posts/${postId}`);
  return data;
};