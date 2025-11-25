'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, XCircle, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore, CartResponse, CartItem } from '@/store/cart-store'; // Import CartResponse and CartItem from store
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, isLoading, fetchCart, updateCartItem, removeCartItem, clearUserCart } = useCartStore(); // Destructure actions
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, { quantity: newQuantity });
    } catch (err: any) {
      // Error is handled by store's toast
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeCartItem(itemId);
    } catch (err: any) {
      // Error is handled by store's toast
    }
  };

  const handleClearCart = async () => {
    try {
      await clearUserCart();
    } catch (err: any) {
      // Error is handled by store's toast
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <h2 className="text-2xl font-semibold">Error loading cart.</h2>
        <p>{error}</p>
        <Button onClick={fetchCart} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/restaurants">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          {/* Restaurant Info */}
          {cart.restaurant_id && (
            <div className="flex items-center space-x-4 mb-6">
              {cart.restaurant_logo && (
                <Image
                  src={cart.restaurant_logo || '/placeholder-restaurant.svg'}
                  alt={cart.restaurant_name || 'Restaurant'}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{cart.restaurant_name}</h2>
                {cart.restaurant_name && (
                  <Link href={`/restaurants/${cart.restaurant_name.toLowerCase().replace(/\s/g, '-')}`} className="text-primary-600 text-sm hover:underline">
                    View Restaurant
                  </Link>
                )}
              </div>
            </div>
          )}
          <Separator className="mb-6" />

          {/* Cart Items */}
          <div className="space-y-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center border-b pb-4 last:border-b-0 last:pb-0">
                <Image
                  src={item.item_image || '/placeholder-food.svg'}
                  alt={item.item_name || 'Menu Item'}
                  width={80}
                  height={80}
                  className="rounded-md object-cover mr-4"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800">{item.item_name}</h3>
                  <p className="text-gray-600 text-sm">{item.item_description}</p>
                  <p className="text-primary-600 font-medium">₹{item.unit_price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={handleClearCart}
            className="mt-6 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <XCircle className="h-4 w-4 mr-2" /> Clear Cart
          </Button>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal ({cart.total_items} items)</span>
              <span>₹{cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>
                {cart.delivery_fee === 0 ? 'Free' : `₹${cart.delivery_fee.toFixed(2)}`}
              </span>
            </div>
            {/* Add Tax, Discount if applicable */}
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>₹{(cart.subtotal + cart.delivery_fee).toFixed(2)}</span> {/* Simplified total */}
            </div>
          </div>
          <Link href="/checkout">
            <Button size="lg" className="w-full mt-8">
              Proceed to Checkout
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
