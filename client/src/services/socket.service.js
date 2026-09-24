import { io } from 'socket.io-client';
import { IS_DEMO_MODE } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

// ─── No-op socket stub used in demo mode ─────────────────────────────────────
const noopSocket = {
  connected: false,
  id: 'demo-socket',
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => noopSocket,
  connect: () => noopSocket,
  disconnect: () => {},
};

export const socketService = {
  /**
   * Establish socket connection with authentication token.
   * In demo mode, returns a no-op stub so the app doesn't crash.
   */
  connect: (token) => {
    if (IS_DEMO_MODE) {
      console.info('[Demo Mode] Socket connection skipped — using stub.');
      socket = noopSocket;
      return socket;
    }

    if (socket && socket.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to signaling server socket:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from signaling server socket:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return socket;
  },

  /** Get active socket instance */
  getSocket: () => socket,

  /** Disconnect active socket */
  disconnect: () => {
    if (socket && !IS_DEMO_MODE) {
      socket.disconnect();
      console.log('Socket connection closed manually.');
    }
    socket = null;
  },
};

export default socketService;
