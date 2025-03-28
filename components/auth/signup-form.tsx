'use client';

import { Gamepad2 as GameController } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authApi, { SignUpData } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';

export default function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SignUpData>({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: 'male',
    DOB: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|edu|net)$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please use an email ending with .com, .edu, or .net',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match',
      });
      return;
    }

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Password',
        description: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
      });
      return;
    }

    const phoneRegex = /^(002|\+2)?01[0125][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description: 'Please enter a valid Egyptian phone number',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.signup(formData);

      if (!response.success) {
        let errorMessage = response.message || 'An error occurred during registration';
        if (response.errors) {
          errorMessage = Object.values(response.errors).join(', ');
        }
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: errorMessage,
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Please check your email to verify your account.',
      });
      
      // Wait for email verification before redirecting
      router.push('/auth/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to connect to the server',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-500/20 bg-black/80">
      <form onSubmit={handleSubmit}>
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
            <GameController className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Join the Gaming Community
          </CardTitle>
          <CardDescription className="text-white">
            Create your account to start your gaming journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              placeholder="Choose a username (2-20 characters, letters and numbers only)"
              className="border-purple-500/20 bg-black/50 text-white placeholder:text-gray-500"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              required
              minLength={2}
              maxLength={20}
              pattern="[a-zA-Z0-9]+"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email (.com, .edu, or .net domains only)"
              type="email"
              className="border-purple-500/20 bg-black/50 text-white placeholder:text-gray-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              type="password"
              className="border-purple-500/20 bg-black/50 text-white placeholder:text-gray-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              className="border-purple-500/20 bg-black/50 text-white placeholder:text-gray-500"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Egyptian phone number (e.g., 01xxxxxxxxx)"
              type="tel"
              className="border-purple-500/20 bg-black/50 text-white placeholder:text-gray-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              pattern="(002|\+2)?01[0125][0-9]{8}"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-white">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' })}
            >
              <SelectTrigger className="border-purple-500/20 bg-black/50 text-white">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-white">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              className="border-purple-500/20 bg-black/50 text-white"
              value={formData.DOB}
              onChange={(e) => setFormData({ ...formData, DOB: e.target.value })}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-white text-center w-full">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}