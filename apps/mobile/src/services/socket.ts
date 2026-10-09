import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string, serverUrl = 'http://localhost:3001'): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(serverUrl, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('⚡ Socket.io connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket.io disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
