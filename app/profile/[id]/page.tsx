'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Check, MessageSquare, UserPlus, UserMinus, Shield, Camera, Settings, UserX, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import PostCard from '@/components/post/post-card';
import SettingsDialog from '@/components/profile/settings-dialog';
import jwtDecode from 'jwt-decode';

interface User {
  _id: string;
  userName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  DOB: string;
  profileImage?: {
    secure_url: string;
  };
  coverImage?: {
    secure_url: string;
  };
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
  };
}

interface TokenPayload {
  userId: string;
}

interface LoadingStates {
  [key: string]: {
    action: string;
    loading: boolean;
  };
}

export default function UserProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<User | null>(null);
  const [mutualFriends, setMutualFriends] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
    fetchMutualFriends();
    fetchUserPosts();
  }, [id]);

  const setButtonLoading = (action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [action]: { action, loading: isLoading }
    }));
  };

  const isButtonLoading = (action: string) => {
    return loadingStates[action]?.loading;
  };

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

  const handleCoverClick = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
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

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingCover(true);
      const formData = new FormData();
      formData.append('attachment', file);

      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/users/updateCover', {
        method: 'PATCH',
        headers: {
          'Authorization': token || '',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, coverImage: data.data.coverImage } : null);
        toast({
          title: 'Success',
          description: 'Cover image updated successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to update cover image');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update cover image',
      });
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const handleConfirmRequest = async () => {
    if (isButtonLoading('confirm')) return;

    try {
      setButtonLoading('confirm', true);
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
    } finally {
      setButtonLoading('confirm', false);
    }
  };

  const handleBlock = async () => {
    if (isButtonLoading('block')) return;

    try {
      setButtonLoading('block', true);
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
    } finally {
      setButtonLoading('block', false);
    }
  };

  const handleAddFriend = async () => {
    if (isButtonLoading('add')) return;

    try {
      setButtonLoading('add', true);
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
    } finally {
      setButtonLoading('add', false);
    }
  };

  const handleCancelRequest = async () => {
    if (isButtonLoading('cancel')) return;

    try {
      setButtonLoading('cancel', true);
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
    } finally {
      setButtonLoading('cancel', false);
    }
  };

  const handleUnfriend = async () => {
    if (isButtonLoading('unfriend')) return;

    try {
      setButtonLoading('unfriend', true);
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
    } finally {
      setButtonLoading('unfriend', false);
    }
  };

  const handleButtonClick = (action: string) => {
    const button = document.getElementById(`profile-button-${action}`);
    if (button) {
      button.classList.add('animate-ripple');
      setTimeout(() => {
        button.classList.remove('animate-ripple');
      }, 600);
    }
  };

  const renderFriendshipButton = () => {
    if (!profile || profile.isMe) return null;

    switch (profile.status) {
      case 'isFriends':
        return (
          <div className="flex gap-2">
            <Button 
              id="profile-button-unfriend"
              variant="ghost" 
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 button-hover-effect relative overflow-hidden"
              onClick={() => {
                handleButtonClick('unfriend');
                handleUnfriend();
              }}
              disabled={isButtonLoading('unfriend')}
            >
              {isButtonLoading('unfriend') ? (
                'Unfriending...'
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unfriend
                </>
              )}
            </Button>
            <Button
              id="profile-button-block"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 button-hover-effect relative overflow-hidden"
              onClick={() => {
                handleButtonClick('block');
                handleBlock();
              }}
              disabled={isButtonLoading('block')}
            >
              {isButtonLoading('block') ? (
                'Blocking...'
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Block
                </>
              )}
            </Button>
          </div>
        );
      case 'cancelRequest':
        return (
          <div className="flex gap-2">
            <Button 
              id="profile-button-cancel"
              variant="ghost" 
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 button-hover-effect relative overflow-hidden"
              onClick={() => {
                handleButtonClick('cancel');
                handleCancelRequest();
              }}
              disabled={isButtonLoading('cancel')}
            >
              {isButtonLoading('cancel') ? (
                'Cancelling...'
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Cancel Request
                </>
              )}
            </Button>
            <Button
              id="profile-button-block"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 button-hover-effect relative overflow-hidden"
              onClick={() => {
                handleButtonClick('block');
                handleBlock();
              }}
              disabled={isButtonLoading('block')}
            >
              {isButtonLoading('block') ? (
                'Blocking...'
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Block
                </>
              )}
            </Button>
          </div>
        );
      case 'confirmRequest':
        return (
          <div className="flex gap-2">
            <Button 
              id="profile-button-confirm"
              className="bg-purple-600 hover:bg-purple-700 button-hover-glow relative overflow-hidden"
              onClick={() => {
                handleButtonClick('confirm');
                handleConfirmRequest();
              }}
              disabled={isButtonLoading('confirm')}
            >
              {isButtonLoading('confirm') ? (
                'Confirming...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Request
                </>
              )}
            </Button>
            <Button
              id="profile-button-block"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 button-hover-effect relative overflow-hidden"
              onClick={() => {
                handleButtonClick('block');
                handleBlock();
              }}
              disabled={isButtonLoading('block')}
            >
              {isButtonLoading('block') ? (
                'Blocking...'
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Block
                </>
              )}
            </Button>
          </div>
        );
      case 'addFriend':
        return (
          <div className="flex gap-2">
            <Button 
              id="profile-button-add"
              className="bg-purple-600 hover:bg-purple-700 button-hover-glow relative overflow-hidden"
              onClick={() => {
                handleButtonClick('add');
                handleAddFriend();
              }}
              disabled={isButtonLoading('add')}
            >
              {isButtonLoading('add') ? (
                'Sending...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </>
              )}
            </Button>
            <Button
              id="profile-button-block"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 button-hover-effect relative overflow-hidden"
              onClick={() => {
                handleButtonClick('block');
                handleBlock();
              }}
              disabled={isButtonLoading('block')}
            >
              {isButtonLoading('block') ? (
                'Blocking...'
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Block
                </>
              )}
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

  const defaultCoverImage = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=3270&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="relative">
        <div className="h-[300px] md:h-[400px] relative group">
          <img
            src={profile.coverImage?.secure_url || defaultCoverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {profile.isMe && (
            <>
              <div
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={handleCoverClick}
              >
                <div className="text-white text-center">
                  <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                  <span>Change Cover Photo</span>
                </div>
              </div>
              <input
                type="file"
                ref={coverInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCoverChange}
                disabled={isUpdatingCover}
              />
            </>
          )}

          <div className="absolute -bottom-24 left-0 right-0 px-4">
            <div className="container max-w-4xl mx-auto">
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
                      {profile.isMe && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 text-purple-400 hover:text-purple-300 hover:bg-purple-600/10"
                          onClick={() => setIsSettingsOpen(true)}
                        >
                          <Settings className="w-5 h-5" />
                        </Button>
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
                        <Button asChild className="bg-purple-600 hover:bg-purple-700 button-hover-glow">
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
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto mt-32 px-4">
        {!profile.isMe && mutualFriends.length > 0 && (
          <Card className="bg-[#1a1a1a] border-purple-500/20 p-6 mb-6">
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

        <div className="space-y-6">
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

      {profile.isMe && (
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          currentUser={{
            userName: profile.userName,
            email: profile.email,
            phone: profile.phone,
            gender: profile.gender,
            DOB: profile.DOB,
          }}
        />
      )}
    </div>
  );
}