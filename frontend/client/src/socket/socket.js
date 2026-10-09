// src/socket/socket.js
import { io } from 'socket.io-client';

// autoConnect: false → مبنتصلش أوتوماتيك وقت ما الملف ده يتعمله import
// إحنا هنتحكم إمتى نتصل بإيدنا (بس لما اليوزر يكون مسجل دخول) جوه App.jsx
export const socket = io('http://localhost:3000', {
	autoConnect: false,
});