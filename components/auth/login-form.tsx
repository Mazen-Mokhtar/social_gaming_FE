'use client';

import { TowerControl as GameController } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authApi, { LoginData } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(formData);

      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      toast({
        title: 'Success',
        description: 'Welcome back!',
      });

      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = 'An error occurred during login';

      if (error.response?.data?.message) {
        switch (error.response.data.message) {
          case 'User not found':
            errorMessage = 'Email address not found';
            break;
          case 'Invalid credentials':
            errorMessage = 'Invalid email or password';
            break;
          case 'Email not verified':
            errorMessage = 'Please verify your email before logging in';
            break;
          default:
            errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-500/20 bg-black/80 text-white">
      <form onSubmit={handleSubmit}>
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
            <GameController className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Welcome Back, Gamer!
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              className="border-purple-500/20 bg-black/50 text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Enter your password"
              type="password"
              className="border-purple-500/20 bg-black/50 text-white"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-400 text-center">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300">
              Sign up
            </Link>
          </div>
          <Link href="/auth/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 text-center">
            Forgot your password?
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}