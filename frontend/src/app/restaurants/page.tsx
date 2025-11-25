'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { restaurantApi } from '@/lib/api';
import toast from 'react-hot-toast';

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
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [isVeg, setIsVeg] = useState<boolean | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRestaurants = async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        size: 20,
        search: search || undefined,
        city: city || undefined,
        cuisine: cuisine || undefined,
        is_veg: isVeg !== null ? isVeg : undefined,
        min_rating: minRating !== null ? minRating : undefined,
      };
      const response = await restaurantApi.getAll(params);
      const data = response.data as PaginatedResponse<Restaurant>;
      setRestaurants(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      toast.error('Failed to fetch restaurants.');
      setError(err.response?.data?.detail || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(1); // Fetch on initial load and when filters change
  }, [search, city, cuisine, isVeg, minRating]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRestaurants(newPage);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Restaurants</h1>

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search by name, cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
          <Input
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            icon={<MapPin className="h-4 w-4 text-gray-400" />}
          />
          <Input
            placeholder="Filter by cuisine (e.g., Italian)"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            icon={<UtensilsCrossed className="h-4 w-4 text-gray-400" />}
          />
          <div className="flex items-center space-x-2">
            <label htmlFor="minRating" className="text-sm font-medium text-gray-700">Min Rating:</label>
            <Input
              id="minRating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={minRating === null ? '' : minRating}
              onChange={(e) => setMinRating(e.target.value === '' ? null : parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Button
            variant={isVeg === true ? 'default' : 'outline'}
            onClick={() => setIsVeg(isVeg === true ? null : true)}
          >
            Vegetarian
          </Button>
          <Button
            variant={isVeg === false ? 'default' : 'outline'}
            onClick={() => setIsVeg(isVeg === false ? null : false)}
          >
            Non-Vegetarian
          </Button>
          <Button variant="outline" onClick={() => {
            setSearch('');
            setCity('');
            setCuisine('');
            setIsVeg(null);
            setMinRating(null);
            setPage(1);
          }}>
            Clear Filters
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">Loading restaurants...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && restaurants.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">No restaurants found matching your criteria.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {restaurants.map((restaurant) => (
          <Link href={`/restaurants/${restaurant.slug}`} key={restaurant.id}>
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
              <img
                src={restaurant.cover_image || '/placeholder-restaurant.svg'}
                alt={restaurant.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{restaurant.name}</h2>
                <p className="text-gray-600 text-sm mb-2 flex-grow">{restaurant.description || 'No description available.'}</p>
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <UtensilsCrossed className="w-4 h-4 mr-1" />
                  <span>{restaurant.cuisine_type || 'Mixed Cuisine'}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" />
                    <span className="text-lg font-medium">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 ml-1">({restaurant.total_ratings})</span>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mr-2">
                      {restaurant.delivery_fee === 0 ? 'Free Delivery' : `₹${restaurant.delivery_fee.toFixed(2)} Delivery`}
                    </Badge>
                    <Badge variant="outline">
                      {restaurant.preparation_time} min
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
