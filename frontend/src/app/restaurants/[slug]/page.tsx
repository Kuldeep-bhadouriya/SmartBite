'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Star, Clock, UtensilsCrossed, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cart-store';
import { restaurantApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  image?: string;
  price: number;
  discounted_price?: number;
  item_type: 'veg' | 'non_veg' | 'egg' | 'vegan';
  is_spicy: boolean;
  spice_level: number;
  allergens?: string;
  ingredients?: string;
  preparation_time: number;
  serves: number;
}

interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  image?: string;
  items: MenuItem[];
}

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  cuisine_type?: string;
  logo?: string;
  cover_image?: string;
  rating: number;
  total_ratings: number;
  delivery_fee: number;
  minimum_order: number;
  preparation_time: number;
  is_veg: boolean;
  is_non_veg: boolean;
  opening_time: string;
  closing_time: string;
  categories: MenuCategory[];
}

export default function RestaurantDetailPage() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCartStore();

  useEffect(() => {
    if (!slug) return;

    const fetchRestaurant = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await restaurantApi.getBySlug(slug as string);
        setRestaurant(response.data as Restaurant);
      } catch (err: any) {
        toast.error('Failed to fetch restaurant details.');
        setError(err.response?.data?.detail || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [slug]);

  const handleAddToCart = async (menuItem: MenuItem) => {
    try {
      await addToCart({
        menu_item_id: menuItem.id,
        quantity: 1,
      });
    } catch (error) {
      // Error and success toasts are now handled by the store
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="w-full h-72 rounded-lg mb-8" />
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <h2 className="text-2xl font-semibold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-600">
        <h2 className="text-2xl font-semibold">Restaurant not found.</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Restaurant Header */}
      <div className="relative mb-8 rounded-lg overflow-hidden shadow-lg">
        <Image
          src={restaurant.cover_image || '/placeholder-restaurant.svg'}
          alt={restaurant.name}
          width={1200}
          height={400}
          className="w-full h-72 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
          <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
          <p className="text-gray-200 text-lg mb-2">{restaurant.description}</p>
          <div className="flex items-center text-gray-300 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="mr-3">{restaurant.rating.toFixed(1)} ({restaurant.total_ratings} ratings)</span>
            <UtensilsCrossed className="w-4 h-4 mr-1" />
            <span className="mr-3">{restaurant.cuisine_type || 'Mixed Cuisine'}</span>
            <Clock className="w-4 h-4 mr-1" />
            <span>{restaurant.opening_time} - {restaurant.closing_time}</span>
          </div>
          <div className="flex items-center text-gray-300 text-sm mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{restaurant.address}, {restaurant.city}</span>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-around items-center mb-8 text-center">
        <div>
          <p className="text-lg font-semibold">Delivery Fee</p>
          <p className="text-gray-600">
            {restaurant.delivery_fee === 0 ? 'Free' : `₹${restaurant.delivery_fee.toFixed(2)}`}
          </p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-lg font-semibold">Min. Order</p>
          <p className="text-gray-600">₹{restaurant.minimum_order.toFixed(2)}</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-lg font-semibold">Preparation Time</p>
          <p className="text-gray-600">{restaurant.preparation_time} mins</p>
        </div>
      </div>

      {/* Menu Categories and Items */}
      {restaurant.categories.map((category) => (
        <div key={category.id} className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{category.name}</h2>
          {category.description && (
            <p className="text-gray-600 mb-6">{category.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
                <div className="relative h-48 w-full">
                  <Image
                    src={item.image || '/placeholder-food.svg'}
                    alt={item.name}
                    fill
                    className="rounded-t-lg object-cover"
                  />
                  {item.is_spicy && (
                    <Badge variant="destructive" className="absolute top-2 left-2">Spicy</Badge>
                  )}
                  {item.item_type && (
                    <Badge variant="secondary" className="absolute top-2 right-2 capitalize">
                      {item.item_type.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 flex-grow">{item.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{(item.discounted_price || item.price).toFixed(2)}
                      </span>
                      {item.discounted_price && (
                        <span className="text-gray-500 line-through">₹{item.price.toFixed(2)}</span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(item)}
                      size="sm"
                      className="flex items-center"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
