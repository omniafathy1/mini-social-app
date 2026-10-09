// src/store/navigationStore.js
import { create } from 'zustand';

// ده مش زي authStore (مش محتاج persist هنا، لأن مفيش داعي نفتكر آخر صفحة بعد الـ refresh)
// الفايدة الأساسية: أي component في أي مكان في الشجرة (بوست، كومنت، نتيجة بحث...)
// يقدر ينادي viewProfile(userId) مباشرة من غير ما نعدي الـ callback ده كـ prop
// درجة ورا درجة لحد ما يوصل للمكان اللي محتاجه (ده اسمه "props drilling" ومشكلة معروفة)
export const useNavigationStore = create((set) => ({
  currentView: 'feed', // 'feed' | 'profile'
  profileUserId: null, // بروفايل مين مفتوح دلوقتي

  viewFeed: () => set({ currentView: 'feed', profileUserId: null }),
  viewProfile: (userId) => set({ currentView: 'profile', profileUserId: userId }),
}));


