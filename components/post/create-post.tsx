'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import jwtDecode from 'jwt-decode';

interface CreatePostProps {
  onPostCreated: (newPost: any) => void;
}

interface TokenPayload {
  userId: string;
  userName: string;
  profileImage?: {
    secure_url?: string;
  };
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get user info from token
  const getUserInfo = () => {
    const token = localStorage.getItem('token')?.split(' ')[1]; // Remove role prefix
    if (!token) return null;
    try {
      const decoded: TokenPayload = jwtDecode(token);
      return {
        userId: decoded.userId,
        userName: decoded.userName,
        profileImage: decoded.profileImage?.secure_url
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const userInfo = getUserInfo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 15) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Maximum 15 images allowed',
      });
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add some content or images to your post',
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content);
      formData.append('privacy', 'public');
      files.forEach((file) => {
        formData.append('attachment', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/post', {
        method: 'POST',
        headers: {
          'Authorization': token || '',
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create post');
      }

      onPostCreated(data.data);

      toast({
        title: 'Success',
        description: 'Post created successfully',
      });

      setContent('');
      setFiles([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create post',
      });
    } finally {
      setLoading(false);
    }
  };

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
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={userInfo?.profileImage}
              className="object-cover w-full h-full"
              alt={userInfo?.userName || 'User'}
            />
            <AvatarFallback className="bg-purple-600 text-white">
              {userInfo?.userName?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold">{userInfo?.userName}</span>
        </div>

        <Textarea
          placeholder="Share your gaming moments..."
          className="min-h-[100px] bg-[#2a2a2a] border-purple-500/20 text-white placeholder:text-gray-400 mb-4"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {files.length > 0 && (
          <div className={`grid gap-2 mb-4 ${getImageGridClass(files.length)}`}>
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className={getImageClass(index, files.length)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="images"
              className="flex items-center space-x-2 cursor-pointer text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Image className="w-5 h-5" />
              <span>Add Images</span>
            </label>
          </div>
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </Card>
  );
}