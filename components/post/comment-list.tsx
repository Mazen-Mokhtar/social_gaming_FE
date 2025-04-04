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
    depth?: number;
}

interface CommentListProps {
    postId: string;
    onCommentAdded: (newComment: Comment) => void;
    initialComments?: Comment[];
}

const MAX_DEPTH = 3; // Maximum nesting depth for replies

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
    const [comments, setComments] = useState<Comment[]>(initialComments);
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
            const isLiked = comment?.likes?.some(like =>
                typeof like === 'string'
                    ? like === userId
                    : (like as any)?._id === userId
            ) || false;

            acc[comment._id] = {
                isLiked,
                count: comment.likeCount || comment.likes?.length || 0,
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
            const response = await fetch(`https://socialgaming-production.up.railway.app/post/${postId}/comment?page=${pageNum}`, {
                headers: { 'Authorization': token || '' },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch comments');
            }

            const normalizedComments = data.data.map((comment: Comment) => ({
                ...comment,
                replies: comment.replies || [],
                likes: comment.likes || [],
                likeCount: comment.likeCount || 0,
                depth: 0,
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
            const response = await fetch(`https://socialgaming-production.up.railway.app/post/${postId}/comment/likeUnlike/${commentId}`, {
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
                    const newLikes = currentLikeState.isLiked
                        ? (comment.likes || []).filter(like =>
                            typeof like === 'string'
                                ? like !== userId
                                : (like as any)._id !== userId
                        )
                        : [...(comment.likes || []), userId];
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
                                    ? (reply.likes || []).filter(like =>
                                        typeof like === 'string'
                                            ? like !== userId
                                            : (like as any)._id !== userId
                                    )
                                    : [...(reply.likes || []), userId];
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

    const fetchReplies = async (commentId: string, depth: number = 0) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/post/${postId}/comment/replies/${commentId}`, {
                headers: { 'Authorization': token || '' },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch replies');
            }

            const repliesWithParent = data.data.map((reply: Comment) => ({
                ...reply,
                parentId: commentId,
                depth: depth + 1,
                likes: reply.likes || [],
                likeCount: reply.likeCount || 0,
            }));

            setComments(prevComments => {
                const updateRepliesInComment = (comments: Comment[]): Comment[] => {
                    return comments.map(comment => {
                        if (comment._id === commentId) {
                            return {
                                ...comment,
                                replies: repliesWithParent,
                                replyCount: repliesWithParent.length
                            };
                        }
                        if (comment.replies && comment.replies.length > 0) {
                            return {
                                ...comment,
                                replies: updateRepliesInComment(comment.replies)
                            };
                        }
                        return comment;
                    });
                };

                return updateRepliesInComment(prevComments);
            });

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
            const commentWithDefaults = {
                ...newComment,
                likes: [],
                likeCount: 0,
                depth: 0,
            };
            setComments(prev => [commentWithDefaults, ...prev]);
            initializeLocalLikes([commentWithDefaults]);
            onCommentAdded(commentWithDefaults);
        }
    };

    const handleNewReply = (parentId: string, newReply: Comment, depth: number) => {
        const replyWithParent = {
            ...newReply,
            parentId,
            depth,
            likes: [],
            likeCount: 0,
        };

        setComments(prev => {
            const updateCommentsWithNewReply = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                    if (comment._id === parentId) {
                        const updatedReplies = comment.replies ? [replyWithParent, ...comment.replies] : [replyWithParent];
                        return {
                            ...comment,
                            replyCount: (comment.replyCount || 0) + 1,
                            replies: updatedReplies
                        };
                    }
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: updateCommentsWithNewReply(comment.replies)
                        };
                    }
                    return comment;
                });
            };

            return updateCommentsWithNewReply(prev);
        });

        initializeLocalLikes([replyWithParent]);
        setShowReplies(prev => ({ ...prev, [parentId]: true }));
        onCommentAdded(replyWithParent);
    };

    const toggleReplies = async (commentId: string, depth: number) => {
        if (!showReplies[commentId]) {
            await fetchReplies(commentId, depth);
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
        const depth = comment.depth || 0;
        const canReply = depth < MAX_DEPTH;

        // Calculate indentation based on depth, with a maximum
        const indentClass = isReply
            ? `ml-${Math.min(depth * 2, 6)} md:ml-${Math.min(depth * 4, 12)}`
            : '';

        return (
            <div
                key={comment._id}
                className={`${indentClass} ${isReply ? 'mt-4' : 'mb-6'} max-w-full overflow-hidden`}
            >
                <div className="flex space-x-2 md:space-x-4">
                    <Link href={`/profile/${comment.senderId._id}`}>
                        <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                            <AvatarImage src={comment.senderId.profileImage?.secure_url} />
                            <AvatarFallback>{comment.senderId.userName[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="bg-[#2a2a2a] rounded-lg p-3 md:p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Link href={`/profile/${comment.senderId._id}`}>
                                        <h3 className="font-semibold text-white hover:underline truncate">
                                            {comment.senderId.userName}
                                        </h3>
                                    </Link>
                                    {comment.senderId.verification && (
                                        <Badge variant="secondary" className="bg-purple-600 flex-shrink-0">
                                            <Check className="w-3 h-3" />
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white flex-shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-white mb-2 break-words">{comment.content}</p>
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
                            <p className="text-xs md:text-sm text-gray-400">{formatTimeAgo(comment.createdAt)}</p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 mt-2">
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
                            {canReply && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-purple-400"
                                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Reply
                                </Button>
                            )}
                            {comment.replyCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-gray-400 hover:text-purple-400 ${showReplies[comment._id] ? 'text-purple-400' : ''}`}
                                    onClick={() => toggleReplies(comment._id, depth)}
                                >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    {showReplies[comment._id] ? 'Hide' : `${comment.replyCount}`}
                                </Button>
                            )}
                        </div>

                        {replyingTo === comment._id && (
                            <div className="mt-4 max-w-full">
                                <CommentForm
                                    postId={postId}
                                    parentId={comment._id}
                                    onCommentAdded={(newReply) => {
                                        handleNewReply(comment._id, newReply, depth + 1);
                                        setReplyingTo(null);
                                    }}
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