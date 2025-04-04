'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Users, UserX, Shield, Check, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jwtDecode from 'jwt-decode';
import Link from 'next/link';

interface User {
  _id: string;
  userName: string;
  email: string;
  verification?: boolean;
  profileImage?: {
    secure_url: string;
  };
}

interface FriendSuggestion {
  userDetails: User;
  countMutualFriends: number;
  pending?: boolean;
  senderId?: string;
}

interface FriendRequest {
  friendsReq: User;
  mutualFriendsCount: number;
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

export default function FriendsPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const { toast } = useToast();

  const getUserId = (): string | undefined => {
    const token = localStorage.getItem('token')?.split(' ')[1];
    if (!token) return undefined;
    try {
      const decoded: TokenPayload = jwtDecode(token);
      return decoded.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return undefined;
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSuggestions();
  }, []);

  const setButtonLoading = (userId: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [userId]: { action, loading: isLoading }
    }));
  };

  const isButtonLoading = (userId: string, action: string) => {
    return loadingStates[userId]?.action === action && loadingStates[userId]?.loading;
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/friend/get-friends', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.map((item: any) => item.friendDetails));
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch friends',
      });
    }
  };

  const handleCancelFriendship = async (userId: string) => {
    if (isButtonLoading(userId, 'unfriend')) return;

    try {
      setButtonLoading(userId, 'unfriend', true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/cancel-friend/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        setFriends(prev => prev.filter(friend => friend._id !== userId));
        setSearchResults(prev => prev.filter(result => result._id !== userId));
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel friendship',
      });
    } finally {
      setButtonLoading(userId, 'unfriend', false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/friend/get-friends-requset', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setFriendRequests(data.data);
      }
    } catch (error: any) {
      // Ignore error if no requests
    }
  };

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/friend/suggestions', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (error: any) {
      // Ignore error if no suggestions
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/search?search=${searchQuery}`, {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.map((item: any) => item.userDetails));
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to search friends',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (isButtonLoading(userId, 'send')) return;

    try {
      setButtonLoading(userId, 'send', true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/friend-requset/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Friend request sent successfully',
        });
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.userDetails._id === userId
              ? { ...suggestion, pending: true, senderId: getUserId() } as FriendSuggestion
              : suggestion
          )
        );
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send friend request',
      });
    } finally {
      setButtonLoading(userId, 'send', false);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    if (isButtonLoading(userId, 'cancel')) return;

    try {
      setButtonLoading(userId, 'cancel', true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/cancel-requset/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Friend request cancelled successfully',
        });
        setSuggestions(prev => prev.map(suggestion =>
          suggestion.userDetails._id === userId
            ? { ...suggestion, pending: false, senderId: undefined }
            : suggestion
        ));
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel friend request',
      });
    } finally {
      setButtonLoading(userId, 'cancel', false);
    }
  };

  const handleRequestResponse = async (userId: string, status: 'confirmReq' | 'delete') => {
    if (isButtonLoading(userId, status)) return;

    try {
      setButtonLoading(userId, status, true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/confirm-delete?profile_id=${userId}&status=${status}`, {
        method: 'PUT',
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: status === 'confirmReq' ? 'Friend request accepted' : 'Friend request declined',
        });

        setFriendRequests(prev => prev.filter(request => request.friendsReq._id !== userId));

        if (status === 'confirmReq') {
          fetchFriends();
          setSuggestions(prev => prev.filter(suggestion => suggestion.userDetails._id !== userId));
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process friend request',
      });
    } finally {
      setButtonLoading(userId, status, false);
    }
  };

  const handleBlock = async (userId: string) => {
    if (isButtonLoading(userId, 'block')) return;

    try {
      setButtonLoading(userId, 'block', true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/block-user/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        fetchFriends();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to block user',
      });
    } finally {
      setButtonLoading(userId, 'block', false);
    }
  };

  const handleButtonClick = (action: string, buttonId: string) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('animate-shake');
      setTimeout(() => {
        button.classList.remove('animate-shake');
      }, 300);
    }
  };

  const renderFriendActionButton = (suggestion: FriendSuggestion) => {
    const currentUserId = getUserId();
    const buttonId = `friend-button-${suggestion.userDetails._id}`;
    const userId = suggestion.userDetails._id;

    if (suggestion.pending) {
      if (suggestion.senderId === currentUserId) {
        return (
          <Button
            id={buttonId}
            variant="outline"
            className="text-yellow-400 hover:text-yellow-300 border-yellow-400/20 button-hover-effect"
            onClick={() => {
              handleButtonClick('cancel', buttonId);
              handleCancelRequest(userId);
            }}
            disabled={isButtonLoading(userId, 'cancel')}
          >
            {isButtonLoading(userId, 'cancel') ? (
              'Cancelling...'
            ) : (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Cancel Request
              </>
            )}
          </Button>
        );
      } else {
        return (
          <Button
            id={buttonId}
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 button-hover-glow"
            onClick={() => {
              handleButtonClick('confirm', buttonId);
              handleRequestResponse(userId, 'confirmReq');
            }}
            disabled={isButtonLoading(userId, 'confirmReq')}
          >
            {isButtonLoading(userId, 'confirmReq') ? (
              'Confirming...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm Request
              </>
            )}
          </Button>
        );
      }
    }

    return (
      <Button
        id={buttonId}
        variant="default"
        className="bg-purple-600 hover:bg-purple-700 button-hover-glow"
        onClick={() => {
          handleButtonClick('add', buttonId);
          handleSendRequest(userId);
        }}
        disabled={isButtonLoading(userId, 'send')}
      >
        {isButtonLoading(userId, 'send') ? (
          'Sending...'
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </>
        )}
      </Button>
    );
  };

  return (
    <main className="container max-w-4xl mx-auto py-6 px-4">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1a1a1a]">
          <TabsTrigger value="friends" className="data-[state=active]:bg-purple-600">
            <Users className="w-4 h-4 mr-2" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-purple-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-purple-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="search" className="data-[state=active]:bg-purple-600">
            <Search className="w-4 h-4 mr-2" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <Card key={friend._id} className="p-4 bg-[#1a1a1a] border-purple-500/20 animate-slide-up">
                <div className="flex items-center justify-between">
                  <Link href={`/profile/${friend._id}`} className="flex items-center space-x-4 hover:opacity-80">
                    <Avatar>
                      <AvatarImage src={friend.profileImage?.secure_url} />
                      <AvatarFallback>{friend.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{friend.userName}</h3>
                        {friend.verification && (
                          <Badge variant="secondary" className="bg-purple-600">
                            <Check className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{friend.email}</p>
                    </div>
                  </Link>
                  <div className="flex space-x-2">
                    <Button
                      id={`friend-action-${friend._id}-unfriend`}
                      variant="ghost"
                      size="icon"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 button-hover-effect"
                      onClick={() => {
                        handleButtonClick('unfriend', `friend-action-${friend._id}-unfriend`);
                        handleCancelFriendship(friend._id);
                      }}
                      disabled={isButtonLoading(friend._id, 'unfriend')}
                    >
                      <UserMinus className="w-5 h-5" />
                    </Button>
                    <Button
                      id={`friend-action-${friend._id}-block`}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 button-hover-effect"
                      onClick={() => {
                        handleButtonClick('block', `friend-action-${friend._id}-block`);
                        handleBlock(friend._id);
                      }}
                      disabled={isButtonLoading(friend._id, 'block')}
                    >
                      <Shield className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendRequests.map((request) => (
              <Card key={request.friendsReq._id} className="p-4 bg-[#1a1a1a] border-purple-500/20">
                <div className="flex items-center justify-between">
                  <Link href={`/profile/${request.friendsReq._id}`} className="flex items-center space-x-4 hover:opacity-80">
                    <Avatar>
                      <AvatarImage src={request.friendsReq.profileImage?.secure_url} />
                      <AvatarFallback>{request.friendsReq.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{request.friendsReq.userName}</h3>
                        {request.friendsReq.verification && (
                          <Badge variant="secondary" className="bg-purple-600">
                            <Check className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{request.mutualFriendsCount} mutual friends</p>
                    </div>
                  </Link>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleRequestResponse(request.friendsReq._id, 'confirmReq')}
                      disabled={isButtonLoading(request.friendsReq._id, 'confirmReq')}
                    >
                      {isButtonLoading(request.friendsReq._id, 'confirmReq') ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleRequestResponse(request.friendsReq._id, 'delete')}
                      disabled={isButtonLoading(request.friendsReq._id, 'delete')}
                    >
                      {isButtonLoading(request.friendsReq._id, 'delete') ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions?.map((suggestion, index) => (
              suggestion?.userDetails ? (
                <Card key={suggestion.userDetails?._id || index} className="p-4 bg-[#1a1a1a] border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <Link href={`/profile/${suggestion.userDetails._id}`} className="flex items-center space-x-4 hover:opacity-80">
                      <Avatar>
                        <AvatarImage src={suggestion.userDetails?.profileImage?.secure_url || ""} />
                        <AvatarFallback>{suggestion.userDetails?.userName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{suggestion.userDetails?.userName || "Unknown"}</h3>
                          {suggestion.userDetails?.verification && (
                            <Badge variant="secondary" className="bg-purple-600">
                              <Check className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{suggestion?.countMutualFriends || 0} mutual friends</p>
                      </div>
                    </Link>
                    {renderFriendActionButton(suggestion)}
                  </div>
                </Card>
              ) : null
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#2a2a2a] border-purple-500/20 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((result) => (
              <Card key={result._id} className="p-4 bg-[#1a1a1a] border-purple-500/20">
                <div className="flex items-center justify-between">
                  <Link href={`/profile/${result._id}`} className="flex items-center space-x-4 hover:opacity-80">
                    <Avatar>
                      <AvatarImage src={result.profileImage?.secure_url} />
                      <AvatarFallback>{result.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{result.userName}</h3>
                        {result.verification && (
                          <Badge variant="secondary" className="bg-purple-600">
                            <Check className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{result.email}</p>
                    </div>
                  </Link>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      onClick={() => handleCancelFriendship(result._id)}
                      disabled={isButtonLoading(result._id, 'unfriend')}
                    >
                      <UserMinus className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleBlock(result._id)}
                      disabled={isButtonLoading(result._id, 'block')}
                    >
                      <Shield className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}