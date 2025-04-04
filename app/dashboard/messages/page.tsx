'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image as ImageIcon, Send, Check, ChevronLeft, ChevronRight, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/use-chat';
import { Message, setCurrentChat, getUserIdFromToken } from '@/lib/websocket';
import { Suspense } from 'react';

interface User {
  _id: string;
  userName: string;
  profileImage?: {
    secure_url: string;
  };
  verification?: boolean;
  isOnline?: boolean;
}

interface Conversation {
  conversations: {
    lastMessage: {
      _id: string;
      content: string;
      attachment?: Array<{ secure_url: string }>;
      updatedAt: string;
    };
    countUnRead: number;
  };
  userDetails: User;
}

function MessagesContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChatState] = useState<string | null>(null);
  const [currentChatUser, setCurrentChatUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsCache = useRef<{ [key: string]: Message[] }>({});
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');

  const {
    isConnected,
    error,
    sendMessage,
    sendTypingStatus,
    likeMessage,
  } = useChat({
    currentChat,
    onNewMessage: handleNewMessage,
    onMessageLiked: handleMessageLiked,
    onUserStatus: handleUserStatus,
    onTypingStatus: (isTyping) => setIsTyping(isTyping),
  });

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!isConnected) return;
    fetchConversations();
  }, [isConnected]);

  useEffect(() => {
    if (userId && isConnected) {
      handleUserChat(userId);
    }
  }, [userId, isConnected]);

  useEffect(() => {
    setCurrentChat(currentChat);
  }, [currentChat]);

  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/message/conversations', {
        headers: {
          Authorization: token || '',
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
        
        if (!currentChat && data.data.length > 0 && !userId) {
          const firstConversation = data.data[0];
          handleUserChat(firstConversation.userDetails._id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      setLoadingChat(true);

      if (conversationsCache.current[chatId]) {
        setMessages(conversationsCache.current[chatId]);
        setLoadingChat(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/message/chat/${chatId}`, {
        headers: {
          Authorization: token || '',
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();

      if (data.success) {
        const normalizedMessages = data.data.map((msg: Message) => ({
          ...msg,
          likes: Array.isArray(msg.likes) ? msg.likes : [],
        }));
        
        conversationsCache.current[chatId] = normalizedMessages;
        setMessages(normalizedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      setMessages([]);
      console.error('Error fetching chat messages:', error);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleUserChat = async (userId: string) => {
    if (currentChat === userId) return;

    try {
      setLoadingChat(true);
      const token = localStorage.getItem('token');

      const userResponse = await fetch(`https://socialgaming-production.up.railway.app/users/user/${userId}`, {
        headers: {
          Authorization: token || '',
          'Cache-Control': 'no-cache',
        },
      });
      const userData = await userResponse.json();

      if (userData.success) {
        setCurrentChatUser(userData.data);
        setCurrentChatState(userId);
        await fetchChatMessages(userId);
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start chat',
      });
    } finally {
      setLoadingChat(false);
    }
  };

  function handleNewMessage(message: Message) {
    const normalizedMessage = {
      ...message,
      likes: Array.isArray(message.likes) ? message.likes : [],
    };

    if (message.senderId._id === currentChat || message.resverId._id === currentChat) {
      setMessages(prev => [...prev, normalizedMessage]);
      
      if (currentChat) {
        conversationsCache.current[currentChat] = [
          ...conversationsCache.current[currentChat] || [],
          normalizedMessage
        ];
      }

      setTimeout(scrollToBottom, 100);
    }

    setConversations(prev => {
      const updatedConversations = [...prev];
      const conversationIndex = updatedConversations.findIndex(
        conv => conv.userDetails._id === (
          message.senderId._id === getUserIdFromToken() 
            ? message.resverId._id 
            : message.senderId._id
        )
      );

      if (conversationIndex !== -1) {
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          conversations: {
            ...updatedConversations[conversationIndex].conversations,
            lastMessage: {
              _id: message._id,
              content: message.content,
              attachment: message.attachment,
              updatedAt: message.createdAt,
            },
          },
        };
        
        const [conversation] = updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(conversation);
      }

      return updatedConversations;
    });
  }

  function handleMessageLiked({ messageId, likes }: { messageId: string; likes: string[] }) {
    setMessages(prev =>
      prev.map(message =>
        message._id === messageId
          ? { ...message, likes: Array.isArray(likes) ? likes : [] }
          : message
      )
    );
  }

  function handleUserStatus({ userId, status }: { userId: string; status: 'online' | 'offline' }) {
    setConversations(prev =>
      prev.map(conv =>
        conv.userDetails._id === userId
          ? { ...conv, userDetails: { ...conv.userDetails, isOnline: status === 'online' } }
          : conv
      )
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 15) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Maximum 15 images allowed',
      });
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    sendTypingStatus(true);

    const timeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = async () => {
    if (!currentChat || (!messageInput.trim() && selectedFiles.length === 0)) return;

    sendMessage(messageInput, selectedFiles);

    setMessageInput('');
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token')?.split(' ')[1];
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const parsedPayload = JSON.parse(decodedPayload);
      return parsedPayload.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <Card className="p-6 bg-[#1a1a1a] border-purple-500/20">
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400">{error}</p>
        </Card>
      </div>
    );
  }

  if (loading && !conversations.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <Card className="p-8 bg-[#1a1a1a] border-purple-500/20 text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading conversations...</p>
        </Card>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <Card className="p-8 bg-[#1a1a1a] border-purple-500/20 text-center">
          <MessageSquare className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">No Messages Yet</h2>
          <p className="text-gray-400 mb-6">Start a conversation with your friends!</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/dashboard/friends">Find Friends</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex-1 flex h-[calc(100vh-4rem)] w-full bg-[#0f0f0f]">
      <div
        className={`${isSidebarOpen ? 'w-64' : 'w-16'
          } bg-[#1a1a1a] border-r border-purple-500/20 transition-all duration-300`}
      >
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-purple-400 hover:text-purple-300"
          >
            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>
        <div className="flex flex-col items-center py-4 space-y-4">
          {conversations.map((conv) => (
            <div
              key={conv.userDetails._id}
              onClick={() => handleUserChat(conv.userDetails._id)}
              className={`relative cursor-pointer transition-all ${currentChat === conv.userDetails._id ? 'scale-110' : 'hover:scale-105'
                } w-full px-2`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className={`w-10 h-10 border-2 ${currentChat === conv.userDetails._id ? 'border-purple-500' : 'border-transparent'
                    }`}>
                    <AvatarImage src={conv.userDetails.profileImage?.secure_url} />
                    <AvatarFallback>{conv.userDetails.userName[0]}</AvatarFallback>
                  </Avatar>
                  {conv.userDetails.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white truncate">{conv.userDetails.userName}</span>
                      {conv.userDetails.verification && (
                        <Badge variant="secondary" className="bg-purple-600">
                          <Check className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {conv.conversations.lastMessage.content || 'Sent an image'}
                      </p>
                      {conv.conversations.countUnRead > 0 && (
                        <Badge className="bg-purple-600">
                          {conv.conversations.countUnRead}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        {currentChat ? (
          <>
            {currentChatUser && (
              <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] border-b border-purple-500/20 p-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={currentChatUser.profileImage?.secure_url} />
                    <AvatarFallback>{currentChatUser.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${currentChatUser._id}`}
                      className="font-semibold text-white hover:underline"
                    >
                      {currentChatUser.userName}
                    </Link>
                    {currentChatUser.verification && (
                      <Badge variant="secondary" className="bg-purple-600">
                        <Check className="w-3 h-3" />
                      </Badge>
                    )}
                    {currentChatUser.isOnline && (
                      <span className="text-sm text-green-500">Online</span>
                    )}
                    {isTyping && (
                      <span className="text-sm text-purple-400 animate-pulse">typing...</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              ref={messagesContainerRef}
              className="absolute inset-0 bottom-[140px] overflow-y-auto flex flex-col p-4 mt-16"
            >
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-16 h-16 text-purple-400/50 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Messages Yet</h3>
                  <p className="text-gray-400">Start the conversation by sending a message!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const currentUserId = getCurrentUserId();
                    const isMe = message.senderId._id === currentUserId;
                    const isLiked = message.likes?.includes(currentChat || '');

                    return (
                      <div
                        key={message._id}
                        className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.senderId?.profileImage?.secure_url} />
                            <AvatarFallback>{message.senderId?.userName?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-md ${isMe
                              ? 'bg-purple-600 text-white rounded-l-lg rounded-tr-lg'
                              : 'bg-[#2a2a2a] text-white rounded-r-lg rounded-tl-lg'
                              } p-3`}
                          >
                            {message.content && <p className="mb-1">{message.content}</p>}
                            {message.attachment && message.attachment.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {message.attachment.map((img, index) => (
                                  <div key={index} className="relative w-full aspect-w-1 aspect-h-1">
                                    <img
                                      src={img.secure_url}
                                      alt="Attachment"
                                      className="rounded-lg w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>{formatTime(message.createdAt)}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`p-0 h-auto ${isLiked ? 'text-red-400' : 'text-gray-400'}`}
                                  onClick={() => likeMessage(message._id)}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                </Button>
                                {message.likes?.length > 0 && (
                                  <span>{message.likes.length}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-purple-500/20">
              {selectedFiles.length > 0 && (
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative w-24">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-auto rounded-lg object-contain"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <Input
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#2a2a2a] border-purple-500/20 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="mb-4">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarFallback>💬</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Select a Chat</h2>
              <p className="text-sm">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}