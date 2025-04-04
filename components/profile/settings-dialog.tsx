'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: {
    userName: string;
    email: string;
    phone: string;
    gender: 'male' | 'female';
    DOB: string;
  };
}

const phoneRegex = /^(002|\+2)?01[0125][0-9]{8}$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

const profileSchema = z.object({
  userName: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9]+( [a-zA-Z0-9]+)?$/, 'Username can only contain letters, numbers, and one space')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(phoneRegex, 'Invalid Egyptian phone number')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female'])
    .optional(),
  DOB: z.string()
    .refine((date) => !date || new Date(date) < new Date(), {
      message: 'Date of birth must be in the past',
    })
    .optional()
    .or(z.literal('')),
  password: z.string()
    .regex(passwordRegex, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number')
    .optional()
    .or(z.literal('')),
  confirmPassword: z.string()
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsDialog({ open, onOpenChange, currentUser }: SettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: currentUser.userName,
      phone: currentUser.phone,
      gender: currentUser.gender,
      DOB: currentUser.DOB,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    reset({
      userName: currentUser.userName,
      phone: currentUser.phone,
      gender: currentUser.gender,
      DOB: currentUser.DOB,
      password: '',
      confirmPassword: '',
    });
  }, [currentUser, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);

      const updateData = {
        ...data,
        password: data.password || undefined,
        confirmPassword: data.confirmPassword || undefined,
      };

      const token = localStorage.getItem('token');
      const response = await fetch('https://socialgaming-production.up.railway.app/users/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!result.success) {
        console.log({ result })
        throw new Error(result.message || 'Failed to update profile');
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message ? error.message.replace(/\s+/g, ' ') : 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const password = watch('password');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-purple-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Profile Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              {...register('userName')}
              className="bg-[#2a2a2a] border-purple-500/20"
              placeholder="Enter username (2-20 characters, letters and numbers only)"
              onChange={(e) => {
                register('userName').onChange(e);
              }}
            />
            {errors.userName && (
              <p className="text-sm text-red-500">{errors.userName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register('phone')}
              className="bg-[#2a2a2a] border-purple-500/20"
              placeholder="Enter Egyptian phone number"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              defaultValue={currentUser.gender}
              onValueChange={(value) => register('gender').onChange({ target: { value } })}
            >
              <SelectTrigger className="bg-[#2a2a2a] border-purple-500/20">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="DOB">Date of Birth</Label>
            <Input
              id="DOB"
              type="date"
              {...register('DOB')}
              className="bg-[#2a2a2a] border-purple-500/20"
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.DOB && (
              <p className="text-sm text-red-500">{errors.DOB.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className="bg-[#2a2a2a] border-purple-500/20"
              placeholder="Leave blank to keep current password"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {password && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="bg-[#2a2a2a] border-purple-500/20"
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}