'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Clock, DollarSign, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { orderApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  item_name: string;
  item_image?: string;
  quantity: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  restaurant_name?: string;
  restaurant_logo?: string;
  status: string;
  total_amount: number;
  total_items: number;
  created_at: string;
  items: OrderItem[]; // Assuming backend returns items with order response
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getAll();
      const data = response.data as PaginatedResponse<Order>;
      setOrders(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      toast.error('Failed to fetch orders.');
      setError(err.response?.data?.detail || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrders(newPage);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'pending':
      case 'confirmed':
      case 'preparing':
      case 'out_for_delivery': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Orders</h1>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <h2 className="text-2xl font-semibold">Error loading orders.</h2>
        <p>{error}</p>
        <Button onClick={() => fetchOrders(1)} className="mt-4"><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-3">No orders found</h2>
        <p className="text-gray-600 mb-8">You haven't placed any orders yet. Start exploring!</p>
        <Link href="/restaurants">
          <Button size="lg">Browse Restaurants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center">
            {order.restaurant_logo && (
              <Image
                src={order.restaurant_logo || '/placeholder-restaurant.svg'}
                alt={order.restaurant_name || 'Restaurant'}
                width={80}
                height={80}
                className="rounded-full object-cover mb-4 md:mb-0 md:mr-6"
              />
            )}
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  Order #{order.order_number}
                </h2>
                <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">{order.restaurant_name}</span> &bull; {order.total_items} items
              </p>
              <p className="text-gray-500 text-sm flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
              <p className="text-2xl font-bold text-primary-600 mb-2">₹{order.total_amount.toFixed(2)}</p>
              <Link href={`/orders/${order.id}`}> {/* Link to order detail page */}
                <Button variant="outline" size="sm">
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
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
