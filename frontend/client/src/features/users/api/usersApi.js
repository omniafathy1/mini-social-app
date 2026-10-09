// src/features/users/api/usersApi.js
import { axiosClient } from '../../../api/axiosClient';

export const getUserProfile = async (userId) => {
  const { data } = await axiosClient.get(`/users/${userId}`);
  return data.user;
};

export const getUserPosts = async (userId) => {
  const { data } = await axiosClient.get(`/users/${userId}/posts`);
  return data.posts;
};

export const toggleFollow = async (userId) => {
  const { data } = await axiosClient.post(`/users/${userId}/follow`);
  return data; // { following, followersCount }
};

export const getFollowers = async (userId) => {
  const { data } = await axiosClient.get(`/users/${userId}/followers`);
  return data.followers;
};

export const getFollowing = async (userId) => {
  const { data } = await axiosClient.get(`/users/${userId}/following`);
  return data.following;
};

export const uploadAvatar = async ({ userId, image }) => {
  const formData = new FormData();
  formData.append('avatar', image);

  const { data } = await axiosClient.put(`/users/${userId}/avatar`, formData, {
    // نسيب المتصفح يحدد الـ Content-Type ويحط الـ boundary الصح بنفسه
    headers: { 'Content-Type': undefined },
  });
  return data.user;
};