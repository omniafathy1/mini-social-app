// src/features/auth/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      currentUser: null,
      token: null, // Short-lived Access Token

      setAuth: (user, token) => set({ currentUser: user, token }),

      setToken: (token, user = null) =>
        set((state) => ({
          token,
          currentUser: user || state.currentUser,
        })),

      setUser: (user) => set({ currentUser: user }),

      logout: () => set({ currentUser: null, token: null }),
    }),
    {
      name: 'auth-storage',
      // Store user and access token in localStorage for page refresh persistence
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
      }),
    }
  )
);