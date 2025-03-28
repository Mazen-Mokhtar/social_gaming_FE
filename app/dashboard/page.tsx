'use client';

import { useEffect, useState } from 'react';
import PostFeed from '@/components/post/post-feed';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, Users, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UserProfile {
  _id: string;
  userName: string;
  profileImage?: {
    secure_url: string;
  };
  verification?: boolean;
  friends: Array<{
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
    isOnline?: boolean;
  }>;
  viewYourProfile: Array<{
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
  }>;
}

interface SearchResult {
  _id: string;
  userName: string;
  profileImage?: {
    secure_url: string;
  };
  verification?: boolean;
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/users/profile', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.data);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch user profile',
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/users/search?search=${searchQuery}`, {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to search users',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0f0f0f] min-h-screen">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Search Bar - Top Right */}
        <div className="flex justify-end mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex gap-2 w-64">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#2a2a2a] border-purple-500/20 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isSearching}
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0 bg-[#1a1a1a] border-purple-500/20"
              align="end"
              style={{ maxHeight: '400px', overflowY: 'auto' }}
            >
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((user) => (
                    <Link key={user._id} href={`/profile/${user._id}`}>
                      <div className="flex items-center space-x-4 p-3 hover:bg-purple-600/10 transition-colors">
                        <Avatar>
                          <AvatarImage src={user.profileImage?.secure_url} />
                          <AvatarFallback>{user.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{user.userName}</span>
                          {user.verification && (
                            <Badge variant="secondary" className="bg-purple-600">
                              <Check className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="p-4 text-center text-gray-400">
                  No users found
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>

        {userProfile && (
          <Card className="bg-[#1a1a1a] border-purple-500/20 p-6 mb-6">
            <Link href={`/profile/${userProfile._id}`} className="flex items-center space-x-4 hover:opacity-80">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userProfile.profileImage?.secure_url} />
                <AvatarFallback>{userProfile.userName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{userProfile.userName}</h2>
                  {userProfile.verification && (
                    <Badge variant="secondary" className="bg-purple-600">
                      <Check className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-gray-400 mt-1">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{userProfile.friends.length} Friends</span>
                  <span className="mx-2">•</span>
                  <span>{userProfile.viewYourProfile.length} Profile Views</span>
                </div>
              </div>
            </Link>
          </Card>
        )}
        <PostFeed />
      </div>
    </main>
  );
}