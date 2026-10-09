// src/api/axiosClient.js
import axios from 'axios';
import { useAuthStore } from '../features/auth/store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send and receive HTTP-only cookies (refresh token)
});

// Dedicated client for token refreshing to avoid interceptor recursion
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach access token to outgoing requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Seamlessly refresh expired access tokens with queuing
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response received (network error) or status is not 401, reject immediately
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    // Never attempt to refresh on authentication endpoints (avoids infinite loops and false logouts)
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    // If request was already retried once, session is truly invalid
    if (originalRequest._retry) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // If a refresh is already in progress, enqueue this request until the new token is ready
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call /auth/refresh with credentials (the httpOnly refreshToken cookie will be sent automatically)
      const { data } = await refreshClient.post('/auth/refresh');
      const newAccessToken = data.accessToken || data.token;

      // Update store with fresh access token and user info
      useAuthStore.getState().setToken(newAccessToken, data.user);

      // Notify socket of the refreshed token
      if (typeof window !== 'undefined' && window.__onTokenRefreshed) {
        window.__onTokenRefreshed(newAccessToken);
      }

      processQueue(null, newAccessToken);

      // Re-issue the original request with the new access token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      console.warn('Session refresh failed. Signing out user.');
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);