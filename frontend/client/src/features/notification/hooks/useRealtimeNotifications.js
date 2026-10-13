// src/features/notifications/hooks/useRealtimeNotifications.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../../../socket/socket';

export function useRealtimeNotifications() {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!socket) return undefined;

		function handleNewNotification(notification) {
			if (!notification) return;

			queryClient.setQueryData(['notifications', 'list'], (oldList = []) => {
				if (!oldList.some((item) => item.id === notification.id)) {
					return [notification, ...oldList];
				}
				return oldList;
			});

			queryClient.setQueryData(['notifications', 'unreadCount'], (oldCount = 0) => oldCount + 1);
		}

		socket.on('notification:new', handleNewNotification);

		return () => {
			socket.off('notification:new', handleNewNotification);
		};
	}, [queryClient]);
}