'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded: (newComment: any) => void;
  className?: string;
}

export default function CommentForm({ postId, parentId, onCommentAdded, className = '' }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add a comment or image',
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content);
      if (file) {
        formData.append('attachment', file);
      }

      const token = localStorage.getItem('token');
      const url = parentId 
        ? `http://localhost:3001/post/${postId}/comment/${parentId}`
        : `http://localhost:3001/post/${postId}/comment`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to add comment');
      }

      // Create a temporary comment object with the current user's info
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userAvatar = localStorage.getItem('userAvatar');

      // Combine the returned data with user info
      const newComment = {
        ...data.data,
        senderId: {
          _id: data.data.senderId._id || userId,
          userName: data.data.senderId.userName || userName || 'User',
          profileImage: data.data.senderId.profileImage || userAvatar,
          verification: data.data.senderId.verification || false
        },
        likes: data.data.likes || [],
        likeCount: data.data.likeCount || 0,
        replyCount: data.data.replyCount || 0,
        createdAt: data.data.createdAt || new Date().toISOString()
      };

      // Pass the new comment data to parent component
      onCommentAdded(newComment);
      
      toast({
        title: 'Success',
        description: parentId ? 'Reply added successfully' : 'Comment added successfully',
      });

      // Reset form
      setContent('');
      setFile(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add comment',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <Textarea
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        className="min-h-[80px] bg-[#2a2a2a] border-purple-500/20 text-white placeholder:text-gray-400"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      
      {file && (
        <div className="relative w-32 h-32">
          <img
            src={URL.createObjectURL(file)}
            alt="Comment attachment"
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <input
            type="file"
            id={`comment-image-${parentId || 'main'}`}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor={`comment-image-${parentId || 'main'}`}
            className="flex items-center space-x-2 cursor-pointer text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Image className="w-5 h-5" />
            <span>Add Image</span>
          </label>
        </div>
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={loading}
        >
          {loading ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
}