// src/features/auth/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, googleLogin, registerUser, logoutApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const storeLogout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken || data.token);
    },
  });

  const googleMutation = useMutation({
    mutationFn: googleLogin,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken || data.token);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken || data.token);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      storeLogout();
      queryClient.clear();
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    googleLogin: googleMutation.mutate,
    oauthLogin: googleMutation.mutate, // Compatibility alias
    isGoogleLoading: googleMutation.isPending,
    isOauthLoading: googleMutation.isPending,
    googleError: googleMutation.error,
    oauthError: googleMutation.error,

    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}