import { io, Socket } from 'socket.io-client';
import jwtDecode from 'jwt-decode';

// Types
interface TokenPayload {
  userId: string;
  role: string;
}

export interface Message {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
  };
  resverId: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
  };
  attachment?: Array<{
    secure_url: string;
  }>;
  createdAt: string;
  likes: string[];
  likeCount: number;
  read: boolean;
}

export interface SocketMessage {
  message: Message;
}

let socket: Socket | null = null;
let currentChatId: string | null = null;

// Initialize socket connection
const initializeSocket = (): Socket => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const newSocket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Set up message filtering
  newSocket.on('receiveMessage', (data: SocketMessage) => {
    const { message } = data;
    const userId = getUserIdFromToken();
    
    // If we're not in the correct chat, emit an event to update unread count
    if (!currentChatId || (
      message.senderId._id !== currentChatId && 
      message.resverId._id !== currentChatId
    )) {
      newSocket.emit('messageUnread', {
        messageId: message._id,
        chatId: message.senderId._id === userId ? message.resverId._id : message.senderId._id
      });
    }
  });

  return newSocket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = initializeSocket();
  }
  return socket;
};

export const setCurrentChat = (chatId: string | null) => {
  const previousChatId = currentChatId;
  currentChatId = chatId;
  
  if (socket) {
    // Inform server about chat context change
    socket.emit('chatContextChange', { 
      currentChatId: chatId,
      previousChatId: previousChatId 
    });
  }
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentChatId = null;
  }
};

// Helper function to get user ID from token
export const getUserIdFromToken = (): string | null => {
  const token = localStorage.getItem('token')?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded: TokenPayload = jwtDecode(token);
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};