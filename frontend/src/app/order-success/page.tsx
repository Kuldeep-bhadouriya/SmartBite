'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import toast from 'react-hot-toast';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearUserCart } = useCartStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      // Potentially fetch order details from backend to confirm (optional)
      // For now, we trust the redirect
      clearUserCart(); // Clear cart after successful order
      setLoading(false);
    } else {
      toast.error('Order ID not found.');
      router.push('/'); // Redirect to home if no orderId
    }
  }, [orderId, router, clearUserCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Processing your order...</h2>
          <p className="text-gray-600">Please wait while we confirm your order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Placed!</h1>
        <p className="text-gray-700 text-lg mb-6">
          Your order #{orderId} has been successfully placed and is being processed.
        </p>
        <div className="space-y-4">
          <Link href="/orders">
            <Button size="lg" className="w-full">
              View My Orders
            </Button>
          </Link>
          <Link href="/restaurants">
            <Button variant="outline" size="lg" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
