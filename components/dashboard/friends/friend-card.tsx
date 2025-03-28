'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Shield } from 'lucide-react';
import Link from 'next/link';

interface FriendCardProps {
  friend: {
    _id: string;
    userName: string;
    profileImage?: {
      secure_url: string;
    };
    verification?: boolean;
  };
  mutualCount?: number;
  onBlock?: (userId: string) => void;
  showViewProfile?: boolean;
}

export default function FriendCard({ friend, mutualCount, onBlock, showViewProfile = false }: FriendCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border-purple-500/20 rounded-lg">
      <div className="flex items-center space-x-4">
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
          {typeof mutualCount !== 'undefined' && (
            <p className="text-sm text-gray-400">{mutualCount} mutual friends</p>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        {showViewProfile ? (
          <Button
            variant="default"
            className="bg-purple-600 hover:bg-purple-700"
            asChild
          >
            <Link href={`/profile/${friend._id}`}>
              View Profile
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => onBlock?.(friend._id)}
          >
            <Shield className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}