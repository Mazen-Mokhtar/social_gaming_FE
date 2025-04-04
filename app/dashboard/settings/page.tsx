'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Shield, Loader2, Ban, ChevronRight, Settings2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlockedUser {
  _id: string;
  userName: string;
  profileImage?: {
    secure_url: string;
  };
  verification?: boolean;
  isOnline?: boolean;
}

interface ProfileData {
  userName: string;
  phone: string;
  gender: 'male' | 'female';
  DOB: string;
  password?: string;
}

export default function SettingsPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    userName: '',
    phone: '',
    gender: 'male',
    DOB: '',
    password: '',
  });
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isBlockedDialogOpen) {
      fetchBlockedUsers();
    }
  }, [isBlockedDialogOpen]);

  useEffect(() => {
    if (isProfileDialogOpen) {
      fetchProfileData();
    }
  }, [isProfileDialogOpen]);

  // Watch password field changes
  useEffect(() => {
    setShowConfirmPassword(!!profileData.password && profileData.password.length > 0);
    if (!profileData.password || profileData.password.length === 0) {
      setConfirmPassword('');
    }
  }, [profileData.password]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/users/profile', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfileData({
          userName: data.data.userName || '',
          phone: data.data.phone || '',
          gender: data.data.gender || 'male',
          DOB: data.data.DOB ? new Date(data.data.DOB).toISOString().split('T')[0] : '',
          password: '',
        });
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch profile data',
      });
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate userName: only letters, numbers, and single spaces between words
      if (profileData.userName) {
        const trimmedUserName = profileData.userName.trim(); // Remove leading/trailing spaces
        const userNameRegex = /^[a-zA-Z0-9]+( [a-zA-Z0-9]+)*$/; // Single spaces only
        if (!userNameRegex.test(trimmedUserName)) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Username can only contain letters, numbers, and single spaces between words',
          });
          return;
        }
      }
  
      if (profileData.password && profileData.password !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Passwords do not match',
        });
        return;
      }
  
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      const updateData: Partial<ProfileData> = {};
      if (profileData.userName) updateData.userName = profileData.userName.trim(); // Trim before sending
      if (profileData.phone) updateData.phone = profileData.phone;
      if (profileData.gender) updateData.gender = profileData.gender;
      if (profileData.DOB) updateData.DOB = profileData.DOB;
      if (profileData.password) {
        updateData.password = profileData.password;
        updateData.confirmPassword = confirmPassword;
      }
      console.log({updateData})
      const response = await fetch('https://socialgaming-production.up.railway.app/users/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
        },
        body: JSON.stringify(updateData),
      });
  
      const data = await response.json();
      console.log({data})
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
        setIsProfileDialogOpen(false);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile',
      });
    } finally {
      setUpdating(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/users/get-blocks', {
        headers: {
          Authorization: token || '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setBlockedUsers(data.data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch blocked users',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://socialgaming-production.up.railway.app/friend/unBlock-user/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        setBlockedUsers(prev => prev.filter(user => user._id !== userId));
        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Failed to unblock user');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unblock user',
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <main className="container max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Blocked Users Section */}
        <Dialog open={isBlockedDialogOpen} onOpenChange={setIsBlockedDialogOpen}>
          <DialogTrigger asChild>
            <Card 
              className="p-4 bg-[#1a1a1a] border-purple-500/20 cursor-pointer hover:bg-purple-600/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white">Blocked Users</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </DialogTrigger>
          
          <DialogContent className="bg-[#1a1a1a] border-purple-500/20 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                Blocked Users
              </DialogTitle>
            </DialogHeader>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading blocked users...</p>
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Ban className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No Blocked Users</h2>
                <p className="text-gray-400">Your block list is empty</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {blockedUsers.map((user) => (
                  <Card key={user._id} className="p-4 bg-[#2a2a2a] border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <Link href={`/profile/${user._id}`} className="flex items-center space-x-4 hover:opacity-80">
                        <Avatar>
                          <AvatarImage src={user.profileImage?.secure_url} />
                          <AvatarFallback>{user.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{user.userName}</h3>
                            {user.verification && (
                              <Badge variant="secondary" className="bg-amber-500">
                                <Check className="w-3 h-3 text-black" />
                              </Badge>
                            )}
                          </div>
                          {user.isOnline && (
                            <p className="text-sm text-green-500">Online</p>
                          )}
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleUnblock(user._id)}
                        disabled={loadingStates[user._id]}
                      >
                        {loadingStates[user._id] ? (
                          'Unblocking...'
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Unblock
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Profile Update Section */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogTrigger asChild>
            <Card 
              className="p-4 bg-[#1a1a1a] border-purple-500/20 cursor-pointer hover:bg-purple-600/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white">Update Profile</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </DialogTrigger>
          
          <DialogContent className="bg-[#1a1a1a] border-purple-500/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-purple-400" />
                Update Profile
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={profileData.userName}
                  onChange={(e) => setProfileData({ ...profileData, userName: e.target.value })}
                  className="bg-[#2a2a2a] border-purple-500/20"
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="bg-[#2a2a2a] border-purple-500/20"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profileData.gender}
                  onValueChange={(value: 'male' | 'female') => setProfileData({ ...profileData, gender: value })}
                >
                  <SelectTrigger className="bg-[#2a2a2a] border-purple-500/20">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profileData.DOB}
                  onChange={(e) => setProfileData({ ...profileData, DOB: e.target.value })}
                  className="bg-[#2a2a2a] border-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={profileData.password}
                  onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                  className="bg-[#2a2a2a] border-purple-500/20"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {showConfirmPassword && (
                <div className="space-y-2 animate-slide-up">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#2a2a2a] border-purple-500/20"
                    placeholder="Confirm your new password"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsProfileDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProfileUpdate}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}