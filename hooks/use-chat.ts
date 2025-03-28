import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, Message } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';

interface UseChatProps {
  currentChat: string | null;
  onNewMessage?: (message: Message) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  onMessageLiked?: (data: { messageId: string; likes: string[] }) => void;
  onUserStatus?: (data: { userId: string; status: 'online' | 'offline' }) => void;
  onUnreadUpdate?: (data: { chatId: string; count: number }) => void;
}

export const useChat = ({
  currentChat,
  onNewMessage,
  onTypingStatus,
  onMessageLiked,
  onUserStatus,
  onUnreadUpdate,
}: UseChatProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const socketInstance = getSocket();
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socketInstance.on('connect_error', (error) => {
        setError('Failed to connect to chat server');
        setIsConnected(false);
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Failed to connect to chat server',
        });
      });

      socketInstance.on('socket_Error', (error: Error) => {
        setError(error.message || 'An error occurred');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'An error occurred',
        });
      });

      socketInstance.on('successMessage', ({ message }) => {
        onNewMessage?.(message);
      });

      socketInstance.on('receiveMessage', ({ message }) => {
        onNewMessage?.(message);
      });

      socketInstance.on('unreadUpdate', (data) => {
        onUnreadUpdate?.(data);
      });

      socketInstance.on('typing', ({ senderId }) => {
        if (senderId === currentChat) {
          onTypingStatus?.(true);
        }
      });

      socketInstance.on('stopTyping', ({ senderId }) => {
        if (senderId === currentChat) {
          onTypingStatus?.(false);
        }
      });

      socketInstance.on('messageLiked', (data) => {
        onMessageLiked?.(data);
      });

      socketInstance.on('userStatus', (data) => {
        onUserStatus?.(data);
      });

      return () => {
        socketInstance.off('successMessage');
        socketInstance.off('receiveMessage');
        socketInstance.off('unreadUpdate');
        socketInstance.off('typing');
        socketInstance.off('stopTyping');
        socketInstance.off('messageLiked');
        socketInstance.off('userStatus');
      };
    } catch (error) {
      setError('Failed to initialize chat');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initialize chat',
      });
    }
  }, [currentChat]);

  const sendMessage = useCallback((content: string, files?: File[]) => {
    if (!socket || !currentChat) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot send message - no active chat or connection',
      });
      return;
    }

    const sendMessageData = async () => {
      try {
        const imageBase64s: string[] = [];

        if (files && files.length > 0) {
          for (const file of files) {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            imageBase64s.push(base64);
          }
        }

        socket.emit('sendMessage', {
          content,
          destId: currentChat,
          images: imageBase64s,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send message',
        });
      }
    };

    sendMessageData();
  }, [socket, currentChat, toast]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!socket || !currentChat) return;
    socket.emit(isTyping ? 'typing' : 'stopTyping', { destId: currentChat });
  }, [socket, currentChat]);

  const likeMessage = useCallback((messageId: string) => {
    if (!socket) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot like message - no connection',
      });
      return;
    }
    socket.emit('likeMessage', { messageId });
  }, [socket, toast]);

  const markMessageAsRead = useCallback((messageId: string) => {
    if (!socket) return;
    socket.emit('messageRead', { messageId });
  }, [socket]);

  return {
    isConnected,
    error,
    sendMessage,
    sendTypingStatus,
    likeMessage,
    markMessageAsRead,
  };
};