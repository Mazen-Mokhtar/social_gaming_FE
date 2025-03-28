'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MoreVertical, Check, Flag, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import CommentList from './comment-list';
import CommentForm from './comment-form';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  userName: string;
  profileImage?: {
    secure_url?: string;
  };
  verification?: boolean;
  _id: string;
}

interface Post {
  _id: string;
  userId?: User;
  content: string;
  likes: string[];
  commentCount: number;
  createdAt: string;
  attachment?: { secure_url: string }[];
  isPost?: boolean;
}

interface PostCardProps {
  post: Post;
  onPostUpdate: () => void;
}

const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    const parsedPayload = JSON.parse(decodedPayload);
    return parsedPayload.userId || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default function PostCard({ post, onPostUpdate }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState({ isLiked: false, count: 0 });
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [comments, setComments] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const userId = getUserIdFromToken();
    setLocalLikes({
      isLiked: userId && post.userId ? post.likes.includes(userId) : false,
      count: post.likes?.length || 0,
    });
  }, [post.likes, post.userId]);

  useEffect(() => {
    setCommentCount(post.commentCount || 0);
  }, [post.commentCount]);

  const handleLike = async () => {
    if (isLiking) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please log in to like posts',
      });
      return;
    }

    setIsLiking(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/post/likeUnLike-post/${post._id}`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
        },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to like post');
      }

      const isNowLiked = !data.message.toLowerCase().includes('unlike');
      setLocalLikes({
        isLiked: isNowLiked,
        count: data.likeCount,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to like post',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/post/delete/${post._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token || '',
        },
      });

      const data = await response.json();
      console.log(data)
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete post');
      }

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });

      onPostUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete post',
      });
    }
  };

  const handleReport = () => {
    toast({
      title: 'Coming Soon',
      description: 'Post reporting feature is not yet implemented',
    });
  };

  const handleCommentAdded = (newComment: any) => {
    setCommentCount((prev) => prev + 1);
    if (!newComment.parentId) {
      setComments((prev) => [newComment, ...prev]);
    }
    setShowComments(true);
  };

  if (!post.userId) {
    return <div className="text-red-500 p-4">Invalid post data: User information missing</div>;
  }

  const getImageGridClass = (length: number) => {
    switch (length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2 md:grid-cols-3';
    }
  };

  const getImageClass = (index: number, total: number) => {
    if (total === 1) {
      return 'aspect-[4/3] w-full object-cover rounded-lg';
    }
    if (total === 2) {
      return 'aspect-square w-full object-cover rounded-lg';
    }
    if (total === 3) {
      if (index === 0) {
        return 'col-span-2 md:col-span-1 aspect-square w-full object-cover rounded-lg';
      }
      return 'aspect-square w-full object-cover rounded-lg';
    }
    if (total === 4) {
      return 'aspect-square w-full object-cover rounded-lg';
    }
    return 'aspect-square w-full object-cover rounded-lg';
  };

  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20 mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/profile/${post.userId._id}`} className="flex items-center space-x-3 hover:opacity-80">
            <Avatar>
              <AvatarImage src={post.userId.profileImage?.secure_url} className="object-cover" />
              <AvatarFallback>{post.userId.userName ? post.userId.userName[0] : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{post.userId.userName || 'Unknown User'}</h3>
                {post.userId.verification && (
                  <Badge variant="secondary" className="bg-purple-600">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-purple-500/20">
              {post.isPost && (
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  onClick={handleDelete}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 cursor-pointer"
                onClick={handleReport}
              >
                <Flag className="w-4 h-4 mr-2" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-white mb-4">{post.content}</p>

        {post.attachment && post.attachment.length > 0 && (
          <div className={`grid gap-2 mb-4 ${getImageGridClass(post.attachment.length)}`}>
            {post.attachment.map((img: any, index: number) => (
              <div key={index} className="relative w-full aspect-w-4 aspect-h-3">
                <img
                  src={img.secure_url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
          <Button
            variant="ghost"
            className={`text-gray-400 hover:text-purple-400 ${localLikes.isLiked ? 'text-purple-400' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart
              className={`w-5 h-5 mr-2 ${localLikes.isLiked ? 'fill-purple-400 text-purple-400' : ''}`}
            />
            {localLikes.count}
          </Button>
          <Button
            variant="ghost"
            className={`text-gray-400 hover:text-purple-400 ${showComments ? 'text-purple-400' : ''}`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {commentCount}
          </Button>
          <Button variant="ghost" className="text-gray-400 hover:text-purple-400">
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 pt-4 border-t border-purple-500/20">
            <CommentForm postId={post._id} onCommentAdded={handleCommentAdded} />
            <CommentList
              postId={post._id}
              onCommentAdded={handleCommentAdded}
              initialComments={comments}
            />
          </div>
        )}
      </div>
    </Card>
  );
}