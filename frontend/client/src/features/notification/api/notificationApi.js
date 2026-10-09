// src/features/notifications/api/notificationsApi.js
import { axiosClient } from '../../../api/axiosClient';

export const getNotifications = async () => {
	const { data } = await axiosClient.get('/notifications');
	return data.notifications;
};

export const getUnreadCount = async () => {
	const { data } = await axiosClient.get('/notifications/unread-count');
	return data.count;
};

export const markAsRead = async (notificationId) => {
	const { data } = await axiosClient.put(`/notifications/${notificationId}/read`);
	return data;
};

export const markAllAsRead = async () => {
	const { data } = await axiosClient.put('/notifications/read-all');
	return data;
};