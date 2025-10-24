import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

export const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const isValidJWT = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('🔌 Connecting socket to:', SOCKET_URL);
      console.log('🔌 User:', user.name, user._id);

      const token = localStorage.getItem('token');

      if (!isValidJWT(token)) {
        console.error('❌ Invalid JWT token, logging out...');
        logout();
        return;
      }

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        path: '/socket.io/'
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setTimeout(() => newSocket.emit('loadRecentChats'), 100);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        if (error.message?.includes('Authentication') || error.message?.includes('jwt')) {
          console.error('❌ JWT authentication failed, logging out...');
          logout();
        }
      });

      newSocket.on('recentChatsLoaded', (chats) => {
        console.log('📚 Recent chats loaded:', chats.length);
        if (Array.isArray(chats)) setRecentChats(chats);
      });

      newSocket.on('newMessageForSidebar', (data) => {
        console.log('📡 New message for sidebar:', {
          messageId: data._id,
          sender: data.sender?.name,
          chatId: data.chatId
        });
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Closing socket connection');
        newSocket.close();
      };
    } else if (socket) {
      console.log('🔌 User logged out, closing socket');
      socket.close();
      setSocket(null);
      setRecentChats([]);
    }
  }, [user, logout]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
