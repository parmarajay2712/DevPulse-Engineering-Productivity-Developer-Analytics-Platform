import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (projectId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // Connect directly to the backend to bypass any Vite proxy WS issues
    console.log('Initializing socket connection to http://localhost:5000...');
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time socket');
      setIsConnected(true);
      newSocket.emit('join-project', projectId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from real-time socket');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [projectId]);

  return { socket, isConnected };
};
