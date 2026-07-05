import { io } from 'socket.io-client';
import { FILE_BASE_URL } from '../api/axios';

// Single shared connection — FILE_BASE_URL is already the API host without
// the `/api` suffix, which is exactly where Socket.io is mounted (src/server.js).
const socket = io(FILE_BASE_URL, { autoConnect: true });

export default socket;
