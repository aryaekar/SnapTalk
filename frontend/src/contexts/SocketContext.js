import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001');
      
      newSocket.emit('join', user.id);
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers(prev => new Map(prev).set(userId, true));
      });

      newSocket.on('userOffline', (userId) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.delete(userId);
          return updated;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user]);

  const sendMessage = (receiverId, message) => {
    if (socket) {
      socket.emit('sendMessage', { receiverId, message });
    }
  };

  const value = {
    socket,
    onlineUsers,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
