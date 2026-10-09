import { axiosClient } from '../../../api/axiosClient';

export const getPosts = async (page = 1, limit = 10) => {
  const { data } = await axiosClient.get('/posts', { params: { page, limit } });
  return data; // { posts, pagination }
};

export const createPost = async (postData) => {
  // لو مفيش صورة، ابعتها JSON عادي زي ما كنا بنعمل بالظبط
  if (!postData.image) {
    const { data } = await axiosClient.post('/posts', { content: postData.content });
    return data;
  }

  // لو فيه صورة، لازم نبعتها كـ FormData (multipart) مش JSON، لأن JSON مينفعش يحمل ملفات
  const formData = new FormData();
  formData.append('content', postData.content);
  formData.append('image', postData.image); // "image" لازم يطابق upload.single("image") في الباك

  const { data } = await axiosClient.post('/posts', formData, {
    // بنشيل الـ "Content-Type: application/json" الافتراضي بتاع axiosClient هنا
    // عشان المتصفح هو اللي يحدد الـ Content-Type الصح (multipart/form-data مع الـ boundary)
    // لو سبناها زي ما هي أو حطينا multipart يدويًا، الـ request هيبقى غلط والباك مش هيقدر يقرا الملف
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