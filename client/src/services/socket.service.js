import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const socketService = {
  /**
   * Establish socket connection with authentication token
   */
  connect: (token) => {
    if (socket && socket.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
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

  /**
   * Get active socket instance
   */
  getSocket: () => {
    return socket;
  },

  /**
   * Disconnect active socket
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('Socket connection closed manually.');
    }
  }
};

export default socketService;
