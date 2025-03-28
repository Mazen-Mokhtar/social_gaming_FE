'use client';

import { TowerControl as GameController } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authApi from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    password: '',
    cPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.cPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match',
      });
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid reset token',
      });
      return;
    }

    try {
      setLoading(true);
      
      // First verify the reset code
      const codeResponse = await authApi.resetCode(formData.code, token);
      if (!codeResponse.success) {
        throw new Error(codeResponse.message || 'Invalid reset code');
      }

      // Then change the password
      const response = await authApi.changePassword({
        password: formData.password,
        cPassword: formData.cPassword
      }, token);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }

      toast({
        title: 'Success',
        description: 'Your password has been reset successfully.',
      });
      router.push('/auth/login');
    } catch (error: any) {
      let errorMessage = 'An error occurred while resetting your password';
      
      if (error.response?.data?.message) {
        switch (error.response.data.message) {
          case 'Invalid code':
            errorMessage = 'The reset code you entered is invalid';
            break;
          case 'Code expired':
            errorMessage = 'The reset code has expired. Please request a new one';
            break;
          case 'Invalid password':
            errorMessage = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
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
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter the code from your email and choose a new password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Reset Code</Label>
            <Input
              id="code"
              placeholder="Enter the code from your email"
              className="border-purple-500/20 bg-black/50 text-white"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              className="border-purple-500/20 bg-black/50 text-white"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              className="border-purple-500/20 bg-black/50 text-white"
              value={formData.cPassword}
              onChange={(e) => setFormData({ ...formData, cPassword: e.target.value })}
              required
            />
          </div>
          <Button 
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
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