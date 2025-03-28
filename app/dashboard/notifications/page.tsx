'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'friendRequest' | 'mention';
  message: string;
  isRead: boolean;
  createdAt: string;
  post?: string;
  sender: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
  };
}

interface PostDetails {
  _id: string;
  content: string;
  userId: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
  };
  likes: any[];
  comments: any[];
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/notification', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.type === 'friendRequest') {
      router.push('/dashboard/friends');
      return;
    }

    if (!notification.post) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Post not found',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/post/details/${notification.post}`, {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        // Navigate to post details page (you'll need to create this page)
        router.push(`/post/${notification.post}`);
      } else {
        throw new Error(data.message || 'Failed to fetch post details');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch post details',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-400" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'friendRequest':
        return <UserPlus className="w-5 h-5 text-green-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <Card className="p-4 bg-[#1a1a1a] border-purple-500/20">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-purple-600/20 rounded w-3/4" />
                    <div className="h-3 bg-purple-600/20 rounded w-1/2" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="p-6 bg-[#1a1a1a] border-purple-500/20 text-center">
            <p className="text-gray-400">No notifications yet</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`p-4 bg-[#1a1a1a] border-purple-500/20 transition-colors cursor-pointer hover:bg-purple-600/5 ${
                !notification.isRead ? 'bg-purple-600/5' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center space-x-4">
                <Link href={`/profile/${notification.sender._id}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={notification.sender.profileImage?.secure_url} />
                    <AvatarFallback>{notification.sender.userName[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${notification.sender._id}`} onClick={(e) => e.stopPropagation()}>
                      <span className="font-semibold text-white hover:underline">
                        {notification.sender.userName}
                      </span>
                    </Link>
                    {notification.sender.verification && (
                      <Badge variant="secondary" className="bg-purple-600">
                        <Check className="w-3 h-3" />
                      </Badge>
                    )}
                    <span className="text-gray-400">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <p className="text-gray-300">{notification.message}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}