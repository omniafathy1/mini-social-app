// src/features/notifications/hooks/useNotifications.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    getUnreadCount,
    markAsRead as markAsReadApi,
    markAllAsRead as markAllAsReadApi,
} from '../api/notificationApi';

export function useNotifications(isOpen = true) { // خلّينا الافتراضي true عشان لو تم استدعاؤه جوه الـ Dropdown يشتغل تلقائياً
    const queryClient = useQueryClient();

    const listQuery = useQuery({
        queryKey: ['notifications', 'list'],
        queryFn: getNotifications,
        enabled: isOpen,
    });

    const unreadQuery = useQuery({
        queryKey: ['notifications', 'unreadCount'],
        queryFn: getUnreadCount,
    });

    const markAsReadMutation = useMutation({
        mutationFn: markAsReadApi,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllMutation = useMutation({
        mutationFn: markAllAsReadApi,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    return {
        // بيانات القائمة وحالتها
        notifications: listQuery.data || [],
        isLoading: listQuery.isLoading,
        isError: listQuery.isError,
        error: listQuery.error,

        // بيانات العداد
        unreadCount: unreadQuery.data ?? 0,

        // كائنات الـ Mutation كاملة للتحكم في الأخطاء والـ Pending States
        markAsReadMutation,
        markAllMutation,
    };
}