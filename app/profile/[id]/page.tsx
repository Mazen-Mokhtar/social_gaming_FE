'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Check, MessageSquare, UserPlus, UserMinus, UserX, Shield, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import PostCard from '@/components/post/post-card';
import jwtDecode from 'jwt-decode';

interface Post {
    _id: string;
    content: string;
    attachment?: { secure_url: string }[];
    likes: string[];
    commentCount: number;
    createdAt: string;
    userId: {
        _id: string;
        userName: string;
        profileImage?: { secure_url: string };
        verification?: boolean;
    };
}

interface MutualFriend {
    _id: string;
    userName: string;
    email: string;
    profileImage?: {
        secure_url: string;
    };
    verification?: boolean;
}

interface UserProfile {
    _id: string;
    userName: string;
    profileImage?: {
        secure_url: string;
    };
    gender: string;
    verification: boolean;
    friends: Array<{
        _id: string;
        userName: string;
        profileImage?: {
            secure_url: string;
        };
        verification?: boolean;
    }>;
    countMutual: number;
    status: 'isFriends' | 'addFriend' | 'cancelRequest' | 'confirmRequest';
    isMe?: boolean;
}

interface TokenPayload {
  userId: string;
}

export default function UserProfilePage() {
    const { id } = useParams();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchUserProfile();
        fetchMutualFriends();
        fetchUserPosts();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/users/user/${id}`, {
                headers: {
                    'Authorization': token || '',
                },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch user profile');
            }

            // Check if this is the current user's profile
            const currentUserId = getUserIdFromToken();
            const isMe = currentUserId === id;

            setProfile({ ...data.data, isMe });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to fetch user profile',
            });
        } finally {
            setLoading(false);
        }
    };

    const getUserIdFromToken = (): string | null => {
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

    const fetchMutualFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/friend/mutual-friends/${id}`, {
                headers: {
                    'Authorization': token || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setMutualFriends(data.data.mutualFriends);
            }
        } catch (error) {
            // Ignore error if no mutual friends
        }
    };

    const fetchUserPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/post/user-posts-id/${id}`, {
                headers: {
                    'Authorization': token || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setPosts(data.data);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch user posts',
            });
        }
    };

    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUpdatingImage(true);
            const formData = new FormData();
            formData.append('attachment', file);

            const token = localStorage.getItem('token');
            const response = await fetch('https://socialgaming-production.up.railway.app/users/updateImage', {
                method: 'PATCH',
                headers: {
                    'Authorization': token || '',
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, profileImage: data.data.profileImage } : null);
                toast({
                    title: 'Success',
                    description: 'Profile image updated successfully',
                });
            } else {
                throw new Error(data.message || 'Failed to update profile image');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update profile image',
            });
        } finally {
            setIsUpdatingImage(false);
        }
    };

    const handleConfirmRequest = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/friend/confirm-delete?profile_id=${id}&status=confirmReq`, {
                method: 'PUT',
                headers: {
                    'Authorization': token || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, status: 'isFriends' } : null);
                toast({
                    title: 'Success',
                    description: 'Friend request accepted',
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to accept friend request',
            });
        }
    };

    const handleBlock = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/friend/block-user/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, status: 'addFriend' } : null);
                toast({
                    title: 'Success',
                    description: 'User blocked successfully',
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to block user',
            });
        }
    };

    const handleAddFriend = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/friend/friend-requset/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': token || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, status: 'cancelRequest' } : null);
                toast({
                    title: 'Success',
                    description: 'Friend request sent successfully',
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to send friend request',
            });
        }
    };

    const handleCancelRequest = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/friend/cancel-requset/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, status: 'addFriend' } : null);
                toast({
                    title: 'Success',
                    description: 'Friend request cancelled',
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to cancel friend request',
            });
        }
    };

    const handleUnfriend = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://socialgaming-production.up.railway.app/friend/cancel-friend/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, status: 'addFriend' } : null);
                toast({
                    title: 'Success',
                    description: 'Friend removed successfully',
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to remove friend',
            });
        }
    };

    const renderFriendshipButton = () => {
        if (!profile || profile.isMe) return null;

        switch (profile.status) {
            case 'isFriends':
                return (
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleUnfriend}
                        >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfriend
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleBlock}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Block
                        </Button>
                    </div>
                );
            case 'cancelRequest':
                return (
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            onClick={handleCancelRequest}
                        >
                            <UserX className="w-4 h-4 mr-2" />
                            Cancel Request
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleBlock}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Block
                        </Button>
                    </div>
                );
            case 'confirmRequest':
                return (
                    <div className="flex gap-2">
                        <Button 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleConfirmRequest}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm Request
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleBlock}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Block
                        </Button>
                    </div>
                );
            case 'addFriend':
                return (
                    <div className="flex gap-2">
                        <Button 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleAddFriend}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Friend
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={handleBlock}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Block
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="container max-w-4xl mx-auto py-8 px-4">
                <div className="animate-pulse">
                    <div className="bg-[#1a1a1a] rounded-lg p-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-24 h-24 bg-purple-600/20 rounded-full" />
                            <div className="flex-1 space-y-4">
                                <div className="h-6 bg-purple-600/20 rounded w-1/4" />
                                <div className="h-4 bg-purple-600/20 rounded w-1/3" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container max-w-4xl mx-auto py-8 px-4">
                <Card className="bg-[#1a1a1a] border-purple-500/20 p-8 text-center">
                    <h2 className="text-xl text-white">User not found</h2>
                </Card>
            </div>
        );
    }

    const coverImage = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=3270&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${coverImage})` }}
            >
                <div className="h-full bg-black/60" />
            </div>

            <div className="container max-w-4xl mx-auto -mt-20 px-4">
                <Card className="bg-[#1a1a1a] border-purple-500/20 p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="relative group">
                            <Avatar className="w-32 h-32 border-4 border-[#1a1a1a]">
                                <AvatarImage src={profile.profileImage?.secure_url} className="object-cover" />
                                <AvatarFallback>{profile.userName[0]}</AvatarFallback>
                            </Avatar>
                            {profile.isMe && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                        onClick={handleImageClick}
                                    >
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={isUpdatingImage}
                                    />
                                </>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold text-white">{profile.userName}</h1>
                                {profile.verification && (
                                    <Badge variant="secondary" className="bg-purple-600">
                                        <Check className="w-3 h-3" />
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-gray-400 mb-4">
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    {profile.friends.length} Friends
                                </div>
                                {!profile.isMe && profile.countMutual > 0 && (
                                    <div className="text-sm">
                                        {profile.countMutual} mutual friends
                                    </div>
                                )}
                            </div>

                            {!profile.isMe && (
                                <div className="flex gap-3">
                                    {renderFriendshipButton()}
                                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                                        <Link href={`/dashboard/messages?user=${profile._id}`}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Message
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {!profile.isMe && mutualFriends.length > 0 && (
                    <Card className="bg-[#1a1a1a] border-purple-500/20 p-6 mt-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Mutual Friends</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {mutualFriends.map((friend) => (
                                <Link href={`/profile/${friend._id}`} key={friend._id}>
                                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-600/10 transition-colors">
                                        <Avatar>
                                            <AvatarImage
                                                src={friend.profileImage?.secure_url}
                                                alt={friend.userName}
                                                className="object-cover"
                                            />
                                            <AvatarFallback>{friend.userName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white">{friend.userName}</p>
                                            {friend.verification && (
                                                <Badge variant="secondary" className="bg-purple-600">
                                                    <Check className="w-3 h-3" />
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}

                <div className="mt-6 space-y-6">
                    <h2 className="text-xl font-semibold text-white">Posts</h2>
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <PostCard key={post._id} post={post} onPostUpdate={fetchUserPosts} />
                        ))
                    ) : (
                        <p className="text-gray-400">No posts available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}