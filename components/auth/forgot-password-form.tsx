'use client';

import { TowerControl as GameController } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authApi from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await authApi.forgetPassword(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }

      toast({
        title: 'Success',
        description: 'Password reset instructions have been sent to your email.',
      });
      router.push('/auth/reset-password');
    } catch (error: any) {
      let errorMessage = 'An error occurred while processing your request';
      
      if (error.response?.data?.message) {
        switch (error.response.data.message) {
          case 'User not found':
            errorMessage = 'No account found with this email address';
            break;
          case 'Email not verified':
            errorMessage = 'Please verify your email before resetting password';
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
            Forgot Your Password?
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email to receive password reset instructions
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Sending Instructions...' : 'Send Instructions'}
          </Button>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-gray-400 text-center w-full">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}