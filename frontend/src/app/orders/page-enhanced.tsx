'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Clock, ChevronRight, RefreshCw, CalendarClock, Zap, Edit, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { orderApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { format, parseISO, isFuture } from 'date-fns';

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
  order_type: 'instant' | 'scheduled';
  total_amount: number;
  total_items: number;
  created_at: string;
  scheduled_date?: string;
  scheduled_time_slot?: string;
  items: OrderItem[];
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
  const [scheduledOrders, setScheduledOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'instant' | 'scheduled'>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getAll();
      const data = response.data as PaginatedResponse<Order>;
      setOrders(data.items || []);
      
      // Fetch scheduled orders separately
      const scheduledResponse = await fetch('/api/v1/orders/scheduled/upcoming');
      if (scheduledResponse.ok) {
        const scheduledData = await scheduledResponse.json();
        setScheduledOrders(scheduledData || []);
      }
    } catch (err: any) {
      toast.error('Failed to fetch orders.');
      setError(err.response?.data?.detail || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    try {
      await fetch(`/api/v1/orders/${selectedOrder.id}/cancel-scheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: cancellationReason }),
      });
      
      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      setSelectedOrder(null);
      setCancellationReason('');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = (order: Order) => {
    if (order.status !== 'pending' && order.status !== 'confirmed') return false;
    if (order.order_type === 'scheduled' && order.scheduled_date) {
      const scheduledTime = parseISO(order.scheduled_date);
      return isFuture(scheduledTime);
    }
    return order.order_type === 'instant';
  };

  const renderOrderCard = (order: Order) => (
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Order #{order.order_number}
            </h2>
            {order.order_type === 'scheduled' && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                Scheduled
              </Badge>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
            {order.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-gray-600 mb-1">
          <span className="font-medium">{order.restaurant_name}</span> &bull; {order.total_items} items
        </p>
        
        {order.order_type === 'scheduled' && order.scheduled_date && order.scheduled_time_slot ? (
          <div className="flex items-center gap-2 text-sm text-primary-600 font-medium mb-1">
            <CalendarClock className="h-4 w-4" />
            <span>
              {format(parseISO(order.scheduled_date), 'EEEE, MMM d, yyyy')} at {order.scheduled_time_slot}
            </span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm flex items-center mb-1">
            <Zap className="w-4 h-4 mr-1" />
            Instant delivery
          </p>
        )}
        
        <p className="text-gray-500 text-sm flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          Ordered: {format(parseISO(order.created_at), 'MMM d, yyyy h:mm a')}
        </p>
      </div>
      <div className="flex flex-col items-start md:items-end mt-4 md:mt-0 gap-2">
        <p className="text-2xl font-bold text-primary-600 mb-2">₹{order.total_amount.toFixed(2)}</p>
        <div className="flex gap-2">
          {order.order_type === 'scheduled' && canCancelOrder(order) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelectedOrder(order);
                setCancelDialogOpen(true);
              }}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm">
              View Details <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const filterOrders = (type: 'all' | 'instant' | 'scheduled') => {
    if (type === 'all') return orders;
    return orders.filter(order => order.order_type === type);
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
        <Button onClick={() => fetchOrders()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
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

  const instantOrders = filterOrders('instant');
  const scheduledOrdersList = filterOrders('scheduled');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">My Orders</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full md:w-[400px] mx-auto grid-cols-3 mb-8">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="instant" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Instant
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-1">
            <CalendarClock className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {orders.map(renderOrderCard)}
        </TabsContent>

        <TabsContent value="instant" className="space-y-6">
          {instantOrders.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No instant delivery orders</p>
            </div>
          ) : (
            instantOrders.map(renderOrderCard)
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          {scheduledOrdersList.length === 0 ? (
            <div className="text-center py-12">
              <CalendarClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No scheduled orders</p>
              <Link href="/restaurants">
                <Button>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule Your First Order
                </Button>
              </Link>
            </div>
          ) : (
            scheduledOrdersList.map(renderOrderCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for canceling this order. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Changed plans, ordered by mistake..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setSelectedOrder(null);
                setCancellationReason('');
              }}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelling || cancellationReason.length < 10}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
