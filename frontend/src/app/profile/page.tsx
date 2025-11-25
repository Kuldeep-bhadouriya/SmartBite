'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User as UserIcon, Phone, Mail, Edit, Save, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  is_verified: boolean;
  role: string;
}

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal(''))
    .refine((val) => !val || /^\+?\d{10,15}$/.test(val), 'Invalid phone number format'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await userApi.getProfile();
      setCurrentUser(response.data as UserProfile);
      reset(response.data); // Set form defaults
    } catch (err: any) {
      toast.error('Failed to fetch user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const response = await userApi.updateProfile(data);
      setCurrentUser(response.data as UserProfile);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-2/3 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">Failed to load user profile.</p>
        <Link href="/auth/login">
          <Button className="mt-4">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Profile</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={currentUser.profile_picture || 'https://www.gravatar.com/avatar/?d=mp'} alt={currentUser.first_name || 'User'} />
            <AvatarFallback>
              {currentUser.first_name ? currentUser.first_name[0] : currentUser.email[0]}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentUser.first_name} {currentUser.last_name}
          </h2>
          <p className="text-gray-600">{currentUser.email}</p>
        </div>

        <Separator className="my-6" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                defaultValue={currentUser.first_name || ''}
                disabled={!isEditing}
                error={errors.first_name?.message}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                defaultValue={currentUser.last_name || ''}
                disabled={!isEditing}
                error={errors.last_name?.message}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register('phone')}
              defaultValue={currentUser.phone || ''}
              disabled={!isEditing}
              error={errors.phone?.message}
              icon={<Phone className="h-4 w-4" />}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={currentUser.email}
              disabled
              icon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {!isEditing ? (
              <Button type="button" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" type="button" onClick={() => {
                  setIsEditing(false);
                  reset(currentUser || {}); // Reset form to current user data
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </form>

        <Separator className="my-6" />

        <div className="space-y-4">
          <Link href="/profile/change-password">
            <Button variant="outline" className="w-full">
              <KeyRound className="mr-2 h-4 w-4" /> Change Password
            </Button>
          </Link>
          <Link href="/profile/addresses">
            <Button variant="outline" className="w-full">
              <MapPin className="mr-2 h-4 w-4" /> Manage Addresses
            </Button>
          </Link>
          {/* Add other profile related links here */}
        </div>
      </div>
    </div>
  );
}
