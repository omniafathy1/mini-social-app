// src/store/navigationStore.js
import { create } from 'zustand';

// Shared transient navigation state avoids passing profile callbacks through the component tree.
export const useNavigationStore = create((set) => ({
  currentView: 'feed', // 'feed' | 'profile'
  profileUserId: null,

  viewFeed: () => set({ currentView: 'feed', profileUserId: null }),
  viewProfile: (userId) => set({ currentView: 'profile', profileUserId: userId }),
  viewSearch: () => set({ currentView: 'search', profileUserId: null }),
}));

