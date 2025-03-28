'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreVertical, Check, Frown, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import CommentForm from '@/components/post/comment-form';
import CommentList from '@/components/post/comment-list';
import Link from 'next/link';

interface User {
  _id: string;
  userName: string;
  profileImage?: {
    secure_url: string;
  };
  verification?: boolean;
}

interface Comment {
  _id: string;
  content: string;
  attachment?: {
    secure_url: string;
  };
  postId: string;
  senderId: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
  };
  likes: Array<{
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
  }>;
  likeCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  perentComment?: string;
}

interface Post {
  _id: string;
  content: string;
  attachment?: Array<{
    secure_url: string;
    public_id: string;
  }>;
  userId: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
  };
  likes: Array<{
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
  }>;
  comments: Comment[];
  privacy: 'public' | 'private' | 'onlyFriends' | 'specific';
  specific?: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export default function PostDetailsPage() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState({ isLiked: false, count: 0 });
  const [showComments, setShowComments] = useState(true);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchPostDetails();
    }
  }, [id, page]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/post/details/${id}?page=${page}`, {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch post details');
      }

      // If it's the first page, set the entire post data
      if (page === 1) {
        setPost(data.data);
      } else {
        // For subsequent pages, append comments to existing ones
        setPost(prev => {
          if (!prev) return data.data;
          return {
            ...prev,
            comments: [...prev.comments, ...data.data.comments]
          };
        });
      }
      
      // Initialize local likes state
      const userId = getUserIdFromToken();
      const isLiked = data.data.likes.some((like: any) => like._id === userId);
      setLocalLikes({
        isLiked,
        count: data.data.likes.length,
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch post details',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleLike = async () => {
    if (!post || isLiking) return;

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

      // Update post likes
      setPost(prev => {
        if (!prev) return prev;
        const userId = getUserIdFromToken();
        const userInfo = prev.likes.find(like => like._id === userId);
        
        if (isNowLiked && userInfo) {
          return {
            ...prev,
            likes: [...prev.likes, userInfo]
          };
        } else {
          return {
            ...prev,
            likes: prev.likes.filter(like => like._id !== userId)
          };
        }
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

  const handleCommentAdded = (newComment: Comment) => {
    if (!post) return;
    
    setPost(prev => {
      if (!prev) return prev;

      // If it's a reply (has perentComment), update the parent comment's replyCount
      if (newComment.perentComment) {
        const updatedComments = prev.comments.map(comment => {
          if (comment._id === newComment.perentComment) {
            return {
              ...comment,
              replyCount: comment.replyCount + 1
            };
          }
          return comment;
        });
        return {
          ...prev,
          comments: updatedComments,
          commentCount: prev.commentCount + 1,
        };
      }

      // If it's a new top-level comment
      return {
        ...prev,
        comments: [newComment, ...prev.comments],
        commentCount: prev.commentCount + 1,
      };
    });
  };

  const loadMoreComments = () => {
    setPage(prev => prev + 1);
  };

  const getImageGridClass = (length: number) => {
    switch (length) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 md:grid-cols-3';
      case 4: return 'grid-cols-2';
      default: return 'grid-cols-2 md:grid-cols-3';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {loading && !post ? (
          <div className="animate-pulse">
            <Card className="bg-[#1a1a1a] border-purple-500/20 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-purple-600/20 rounded w-1/4" />
                  <div className="h-3 bg-purple-600/20 rounded w-1/6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-purple-600/20 rounded w-3/4" />
                <div className="h-4 bg-purple-600/20 rounded w-1/2" />
              </div>
            </Card>
          </div>
        ) : error || !post ? (
          <Card className="bg-[#1a1a1a] border-purple-500/20 p-6 text-center">
            <Frown className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Post Not Found</h2>
            <p className="text-gray-400">{error || 'This post may have been deleted or is not accessible.'}</p>
          </Card>
        ) : (
          <Card className="bg-[#1a1a1a] border-purple-500/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Link href={`/profile/${post.userId._id}`} className="flex items-center space-x-3 hover:opacity-80">
                  <Avatar>
                    <AvatarImage src={post.userId.profileImage?.secure_url} />
                    <AvatarFallback>{post.userId.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{post.userId.userName}</h3>
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
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-white mb-4">{post.content}</p>

              {post.attachment && post.attachment.length > 0 && (
                <div className={`grid gap-2 mb-4 ${getImageGridClass(post.attachment.length)}`}>
                  {post.attachment.map((img, index) => (
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
                  {post.commentCount}
                  {showComments ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
                <Button variant="ghost" className="text-gray-400 hover:text-purple-400">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {showComments && (
              <div className="border-t border-purple-500/20 p-6">
                <CommentForm postId={post._id} onCommentAdded={handleCommentAdded} />
                <div className="mt-6">
                  <CommentList
                    postId={post._id}
                    onCommentAdded={handleCommentAdded}
                    initialComments={post.comments}
                    onLoadMore={loadMoreComments}
                    loading={loading}
                    hasMore={post.comments.length >= 6}
                  />
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}