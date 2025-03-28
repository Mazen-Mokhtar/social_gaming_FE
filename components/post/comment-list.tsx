'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MoreVertical, Frown, ChevronDown, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import CommentForm from './comment-form';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Comment {
    _id: string;
    content: string;
    attachment?: { secure_url: string };
    senderId: {
        _id: string;
        userName: string;
        profileImage?: { secure_url: string };
        verification?: boolean;
    };
    likes: string[];
    likeCount: number;
    replyCount: number;
    createdAt: string;
    replies?: Comment[];
    parentId?: string;
}

interface CommentListProps {
    postId: string;
    onCommentAdded: (newComment: Comment) => void;
    initialComments?: Comment[];
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

export default function CommentList({ postId, onCommentAdded, initialComments = [] }: CommentListProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
    const [localLikes, setLocalLikes] = useState<{ [key: string]: { isLiked: boolean; count: number } }>({});
    const { toast } = useToast();
    const userId = getUserIdFromToken();

    const initializeLocalLikes = (commentsToInit: Comment[]) => {
        const newLikes = commentsToInit.reduce((acc: any, comment: Comment) => {
            const likes = Array.isArray(comment.likes) ? comment.likes : [];
            const isLiked = likes.some(like =>
                typeof like === 'string'
                    ? like === userId
                    : (like as any)._id === userId
            );

            acc[comment._id] = {
                isLiked,
                count: comment.likeCount || likes.length || 0,
            };
            return acc;
        }, {});
        setLocalLikes(prev => ({ ...prev, ...newLikes }));
    };

    const fetchComments = async (pageNum: number, append: boolean = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/post/${postId}/comment?page=${pageNum}`, {
                headers: { 'Authorization': token || '' },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch comments');
            }

            const normalizedComments = data.data.map((comment: Comment) => ({
                ...comment,
                likes: Array.isArray(comment.likes) ? comment.likes : [],
                replies: comment.replies || [],
            }));

            setComments(prev => {
                if (pageNum === 1 && initialComments.length > 0) {
                    const existingIds = new Set(initialComments.map(c => c._id));
                    const filteredNewComments = normalizedComments.filter(c => !existingIds.has(c._id));
                    const result = [...initialComments, ...filteredNewComments];
                    initializeLocalLikes(result);
                    return result;
                }
                const result = append ? [...prev, ...normalizedComments] : normalizedComments;
                initializeLocalLikes(normalizedComments);
                return result;
            });

            setHasMore(normalizedComments.length === 6);
        } catch (error: any) {
            if (error.message === 'Comment not found' && pageNum === 1) {
                setComments(initialComments);
                setHasMore(false);
            } else {
                // toast({
                //     variant: 'destructive',
                //     title: 'Error',
                //     description: error.message || 'Failed to fetch comments',
                // });
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (initialComments.length > 0) {
            const filteredComments = initialComments.filter(comment => !comment.parentId);
            setComments(filteredComments);
            initializeLocalLikes(filteredComments);
            setLoading(false);
        } else {
            fetchComments(1);
        }
    }, [postId]);

    useEffect(() => {
        if (initialComments.length > 0) {
            const filteredNewComments = initialComments.filter(comment => !comment.parentId);
            setComments(prev => {
                const existingIds = new Set(prev.map(c => c._id));
                const uniqueNewComments = filteredNewComments.filter(c => !existingIds.has(c._id));
                const result = [...uniqueNewComments, ...prev];
                initializeLocalLikes(result);
                return result;
            });
        }
    }, [initialComments]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchComments(nextPage, true);
        }
    };

    const handleLike = async (commentId: string) => {
        if (!userId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please log in to like comments',
            });
            return;
        }

        const currentLikeState = localLikes[commentId] || { isLiked: false, count: 0 };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/post/${postId}/comment/likeUnlike/${commentId}`, {
                method: 'PATCH',
                headers: { 'Authorization': token || '' },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to like/unlike comment');
            }

            setLocalLikes(prev => ({
                ...prev,
                [commentId]: {
                    isLiked: !currentLikeState.isLiked,
                    count: data.likeCount,
                },
            }));

            setComments(prev => prev.map(comment => {
                if (comment._id === commentId) {
                    const currentLikes = Array.isArray(comment.likes) ? comment.likes : []; // ضمان إن likes array
                    const newLikes = currentLikeState.isLiked
                        ? currentLikes.filter(like =>
                            typeof like === 'string'
                                ? like !== userId
                                : (like as any)._id !== userId
                        )
                        : [...currentLikes, userId]; // استخدام currentLikes بدل comment.likes مباشرة
                    return {
                        ...comment,
                        likes: newLikes,
                        likeCount: data.likeCount
                    };
                }
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: comment.replies.map(reply => {
                            if (reply._id === commentId) {
                                const newLikes = currentLikeState.isLiked
                                    ? reply.likes.filter(like =>
                                        typeof like === 'string'
                                            ? like !== userId
                                            : (like as any)._id !== userId
                                    )
                                    : [...reply.likes, userId];
                                return {
                                    ...reply,
                                    likes: newLikes,
                                    likeCount: data.likeCount
                                };
                            }
                            return reply;
                        })
                    };
                }
                return comment;
            }));
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to like/unlike comment',
            });
        }
    };

    const fetchReplies = async (commentId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/post/${postId}/comment/replies/${commentId}`, {
                headers: { 'Authorization': token || '' },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch replies');
            }

            const repliesWithParent = data.data.map((reply: Comment) => ({
                ...reply,
                parentId: commentId
            }));

            setComments(prevComments =>
                prevComments.map(comment =>
                    comment._id === commentId ? { ...comment, replies: repliesWithParent } : comment
                )
            );

            initializeLocalLikes(repliesWithParent);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to fetch replies',
            });
        }
    };

    const handleNewComment = (newComment: Comment) => {
        if (!newComment.parentId) {
            setComments(prev => [newComment, ...prev]);
            initializeLocalLikes([newComment]);
            onCommentAdded(newComment);
        }
    };

    const handleNewReply = (parentId: string, newReply: Comment) => {
        const replyWithParent = { ...newReply, parentId };
        setComments(prev => prev.map(comment => {
            if (comment._id === parentId) {
                const updatedReplies = comment.replies ? [replyWithParent, ...comment.replies] : [replyWithParent];
                return {
                    ...comment,
                    replyCount: (comment.replyCount || 0) + 1,
                    replies: updatedReplies
                };
            }
            return comment;
        }));

        initializeLocalLikes([replyWithParent]);

        setShowReplies(prev => ({
            ...prev,
            [parentId]: true
        }));

        onCommentAdded(replyWithParent);
    };

    const toggleReplies = async (commentId: string) => {
        if (!showReplies[commentId]) {
            await fetchReplies(commentId);
        }
        setShowReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    if (loading && comments.length === 0) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                    <div key={i} className="flex space-x-4">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-purple-600/20 rounded w-1/4" />
                            <div className="h-3 bg-purple-600/20 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <Frown className="w-16 h-16 text-purple-400/50 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No comments yet</h3>
                <p className="text-gray-400">Be the first to share your thoughts!</p>
            </div>
        );
    }

    const renderComment = (comment: Comment, isReply: boolean = false) => {
        const formatTimeAgo = (dateString: string | undefined) => {
            if (!dateString || typeof dateString !== 'string') {
                return 'Time unavailable';
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid time';
            }
            return formatDistanceToNow(date, { addSuffix: true });
        };

        const isLiked = localLikes[comment._id]?.isLiked || false;
        const likeCount = localLikes[comment._id]?.count || 0;

        return (
            <div key={comment._id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
                <div className="flex space-x-4">
                    <Link href={`/profile/${comment.senderId._id}`}>
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.senderId.profileImage?.secure_url} />
                            <AvatarFallback>{comment.senderId.userName[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1">
                        <div className="bg-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Link href={`/profile/${comment.senderId._id}`}>
                                        <h3 className="font-semibold text-white hover:underline">{comment.senderId.userName}</h3>
                                    </Link>
                                    {comment.senderId.verification && (
                                        <Badge variant="secondary" className="bg-purple-600">
                                            <Check className="w-3 h-3" />
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-white mb-2">{comment.content}</p>
                            {comment.attachment && (
                                <div className="relative w-full aspect-w-4 aspect-h-3 mb-2">
                                    <img
                                        src={comment.attachment.secure_url}
                                        alt="Comment attachment"
                                        className="w-full h-full object-cover rounded-lg"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <p className="text-sm text-gray-400">{formatTimeAgo(comment.createdAt)}</p>
                        </div>

                        <div className="flex items-center space-x-4 mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`text-gray-400 hover:text-purple-400 ${isLiked ? 'text-purple-400' : ''}`}
                                onClick={() => handleLike(comment._id)}
                            >
                                <Heart
                                    className={`w-4 h-4 mr-1 ${isLiked ? 'fill-purple-400 text-purple-400' : ''}`}
                                />
                                {likeCount}
                            </Button>
                            {!isReply && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-400 hover:text-purple-400"
                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-1" />
                                        Reply
                                    </Button>
                                    {comment.replyCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`text-gray-400 hover:text-purple-400 ${showReplies[comment._id] ? 'text-purple-400' : ''}`}
                                            onClick={() => toggleReplies(comment._id)}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-1" />
                                            {showReplies[comment._id] ? 'Hide Replies' : `${comment.replyCount} Replies`}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        {replyingTo === comment._id && (
                            <div className="mt-4">
                                <CommentForm
                                    postId={postId}
                                    parentId={comment._id}
                                    onCommentAdded={(newReply) => {
                                        handleNewReply(comment._id, newReply);
                                        setReplyingTo(null);
                                    }}
                                    className="ml-12"
                                />
                            </div>
                        )}

                        {showReplies[comment._id] && comment.replies?.map(reply => renderComment(reply, true))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}

            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            'Loading...'
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Load More Comments
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}