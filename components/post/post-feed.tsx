'use client';

import { useEffect, useState } from 'react';
import PostCard from './post-card';
import CreatePost from './create-post';
import { useToast } from '@/hooks/use-toast';
import { Frown } from 'lucide-react';

interface ProfileImage {
  secure_url: string;
  public_id: string;
}

interface Attachment {
  secure_url: string;
  public_id: string;
  likes: string[];
  _id: string;
}

interface Post {
  _id: string;
  content: string;
  likes: string[];
  privacy: string;
  attachment: Attachment[];
  createdAt: string;
  commentCount: number;
  userId: {
    _id: string;
    userName: string;
    profileImage?: ProfileImage;
  };
}

interface PostData {
  friendsPost: Post;
  userDetails: {
    _id: string;
    userName: string;
    profileImage?: ProfileImage;
  };
}

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/post/forYouPage', {
        headers: {
          'Authorization': token || '',
        },
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch posts');
      }

      setPosts(data.data.map((item: PostData) => ({
        ...item.friendsPost,
        userId: {
          ...item.userDetails,
          profileImage: item.userDetails.profileImage || null
        },
      })));
    } catch (error: any) {
      // toast({
      //   variant: 'destructive',
      //   title: 'Error',
      //   description: error.message || 'Failed to fetch posts',
      // });
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-purple-600/20 rounded w-1/4" />
                  <div className="h-3 bg-purple-600/20 rounded w-1/6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-purple-600/20 rounded w-3/4" />
                <div className="h-4 bg-purple-600/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 min-h-screen">
      <CreatePost onPostCreated={handlePostCreated} />
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Frown className="w-24 h-24 text-purple-400/50 mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-3">No Posts Yet</h2>
          <p className="text-gray-400 max-w-md">
            Be the first to share your gaming moments with the community!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onPostUpdate={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}