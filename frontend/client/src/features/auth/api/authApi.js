// src/features/auth/api/authApi.js
import { axiosClient } from '../../../api/axiosClient';

export const loginUser = async ({ email, password }) => {
  const { data } = await axiosClient.post('/auth/login', { email, password });
  return data;
};

export const registerUser = async ({ name, email, password }) => {
  const { data } = await axiosClient.post('/auth/register', { name, email, password });
  return data;
};

export const googleLogin = async ({ credential, idToken, devMode, email, name }) => {
  const payload = devMode
    ? { devMode: true, email, name }
    : { credential, idToken: idToken || credential };

  const { data } = await axiosClient.post('/auth/google', payload);
  return data;
};

export const oauthLogin = googleLogin; // Backward compatibility alias

export const refreshTokenApi = async () => {
  const { data } = await axiosClient.post('/auth/refresh');
  return data;
};

export const logoutApi = async () => {
  const { data } = await axiosClient.post('/auth/logout');
  return data;
};

export const getMeApi = async () => {
  const { data } = await axiosClient.get('/auth/me');
  return data;
};