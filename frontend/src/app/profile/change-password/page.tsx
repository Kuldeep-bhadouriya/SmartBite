'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';

const changePasswordSchema = z.object({
  current_password: z.string().min(8, 'Current password must be at least 8 characters.'),
  new_password: z.string().min(8, 'New password must be at least 8 characters.'),
  confirm_password: z.string().min(8, 'Confirm password must be at least 8 characters.'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "New passwords don't match.",
  path: ['confirm_password'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsChanging(true);
    try {
      await userApi.changePassword({
        old_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Password changed successfully!');
      reset();
      router.push('/profile');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Change Password</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              {...register('current_password')}
              error={errors.current_password?.message}
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          <div>
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              {...register('new_password')}
              error={errors.new_password?.message}
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              {...register('confirm_password')}
              error={errors.confirm_password?.message}
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" type="button" onClick={() => router.push('/profile')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isChanging}>
              {isChanging ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
