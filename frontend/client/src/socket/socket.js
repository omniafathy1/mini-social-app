// src/socket/socket.js
import { io } from 'socket.io-client';

// Connect only after the user is authenticated.
export const socket = io('http://localhost:3000', {
	autoConnect: false,
});