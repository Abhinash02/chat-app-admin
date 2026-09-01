import { io } from 'socket.io-client';

import { authStorage } from './auth-storage.js';
import { getApiOrigin } from './api.js';

export function getSocketOrigin() {
  return getApiOrigin().replace(/\/+$/, '');
}

const SOCKET_URL = getSocketOrigin();

let socket = null;

/**
 * The panel keeps one socket for live signals — presence changes, new payments
 * awaiting review, leaderboard movement. Every one of those also has a REST
 * endpoint, so a dropped socket degrades the panel to "refresh to see changes"
 * rather than breaking it.
 */
export function connectSocket() {
  if (socket?.connected) return socket;

  const token = authStorage.getAccessToken();
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
