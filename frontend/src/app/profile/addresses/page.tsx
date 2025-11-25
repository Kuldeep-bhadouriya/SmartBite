'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Plus, Edit, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { addressApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Address {
  id: number;
  title: string;
  full_address: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  is_active: boolean;
}

const addressSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  street: z.string().min(1, 'Street is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  postal_code: z.string().min(1, 'Postal Code is required.'),
  is_default: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await addressApi.getAll();
      setAddresses(response.data as Address[]);
    } catch (err: any) {
      toast.error('Failed to fetch addresses.');
      setError(err.response?.data?.detail || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenModal = (address?: Address) => {
    setEditingAddress(address || null);
    if (address) {
      reset(address);
    } else {
      reset({ title: '', street: '', city: '', state: '', postal_code: '', is_default: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    reset();
  };

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      if (editingAddress) {
        await addressApi.update(editingAddress.id, data);
        toast.success('Address updated successfully!');
      } else {
        await addressApi.create(data);
        toast.success('Address added successfully!');
      }
      fetchAddresses();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressApi.delete(addressId);
      toast.success('Address deleted successfully!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      await addressApi.setDefault(addressId);
      toast.success('Default address set successfully!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to set default address.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Addresses</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <h2 className="text-2xl font-semibold">Error loading addresses.</h2>
        <p>{error}</p>
        <Button onClick={fetchAddresses} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Addresses</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <Button onClick={() => handleOpenModal()} className="w-full mb-6">
          <Plus className="mr-2 h-4 w-4" /> Add New Address
        </Button>

        {addresses.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <MapPin className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg">No addresses added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="border p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    {address.title}
                    {address.is_default && (
                      <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">Default</span>
                    )}
                  </h3>
                  <p className="text-gray-600">{address.full_address}</p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(address)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAddress(address.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {!address.is_default && (
                    <Button variant="secondary" size="sm" onClick={() => handleSetDefaultAddress(address.id)}>
                      Set Default
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress
                ? 'Update the details for your delivery address.'
                : 'Add a new delivery address to your account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title (e.g., Home, Work)</Label>
              <Input id="title" {...register('title')} error={errors.title?.message} />
            </div>
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" {...register('street')} error={errors.street?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} error={errors.city?.message} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('state')} error={errors.state?.message} />
              </div>
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input id="postal_code" {...register('postal_code')} error={errors.postal_code?.message} />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="is_default"
                type="checkbox"
                {...register('is_default')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_default">Set as default address</Label>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {editingAddress ? 'Save Changes' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
