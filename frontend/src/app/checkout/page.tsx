'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, CreditCard, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { ScheduledDelivery } from '@/components/scheduled-delivery/scheduled-delivery';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore, CartResponse } from '@/store/cart-store';
import { addressApi, orderApi, paymentApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Stripe Integration
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './checkout-form'; // Will create this component

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Address {
  id: number;
  full_address: string;
  is_default: boolean;
}

const checkoutSchema = z.object({
  address_id: z.number({ required_error: 'Please select a delivery address.' }),
  payment_method: z.enum(['card', 'cod'], { required_error: 'Please select a payment method.' }),
  delivery_instructions: z.string().optional(),
  delivery_type: z.enum(['instant', 'scheduled']).default('instant'),
  scheduled_date: z.date().optional(),
  time_slot_id: z.number().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearUserCart } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const selectedPaymentMethod = watch('payment_method');
  const selectedAddressId = watch('address_id');

  useEffect(() => {
    const loadCheckoutData = async () => {
      setLoading(true);
      try {
        await fetchCart();
        const addressResponse = await addressApi.getAll();
        setAddresses(addressResponse.data as Address[]);

        // Set default address if available
        const defaultAddress = addressResponse.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setValue('address_id', defaultAddress.id);
        } else if (addressResponse.data.length > 0) {
          setValue('address_id', addressResponse.data[0].id);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Failed to load checkout data.');
        setError(err.response?.data?.detail || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    loadCheckoutData();
  }, [fetchCart, setValue]);

  const createPaymentIntent = async () => {
    if (!cart) return;
    try {
      const response = await paymentApi.createIntent(cart.id);
      setClientSecret(response.data.client_secret);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create payment intent.');
      setPlacingOrder(false);
      throw error;
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setPlacingOrder(true);
    if (!cart) {
      toast.error('Cart is empty. Please add items before checking out.');
      setPlacingOrder(false);
      return;
    }

    try {
      let orderResponse;
      if (data.payment_method === 'cod') {
        // Place order directly for COD
        orderResponse = await orderApi.create({
          address_id: data.address_id,
          order_type: 'delivery',
          delivery_instructions: data.delivery_instructions,
          payment_method: 'cod',
        });
        toast.success('Order placed successfully (COD)!');
        clearUserCart();
        router.push(`/order-success?orderId=${orderResponse.data.id}`);
      } else if (data.payment_method === 'card') {
        // For card payment, client secret is already created or will be.
        // Actual order placement happens after Stripe confirms payment (in CheckoutForm)
        toast.success('Proceeding to card payment...');
        // The CheckoutForm will handle actual payment confirmation and order placement.
        // No direct order placement here, just ensure clientSecret is ready.
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading || !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Please add items to your cart before checking out.</p>
        <Link href="/restaurants">
          <Button size="lg">Browse Restaurants</Button>
        </Link>
      </div>
    );
  }

  const totalAmount = cart.subtotal + cart.delivery_fee; // Simplified

  const appearance = { theme: 'stripe' as const };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Address and Payment */}
        <div>
          {/* Delivery Address */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-3 text-primary-600" /> Delivery Address
            </h2>
            {addresses.length === 0 ? (
              <p className="text-gray-600">No addresses found. Please add an address to proceed.</p>
            ) : (
              <RadioGroup
                onValueChange={(value) => setValue('address_id', parseInt(value))}
                value={selectedAddressId?.toString()}
                className="space-y-3"
              >
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} />
                    <Label htmlFor={`address-${address.id}`} className="flex-grow cursor-pointer">
                      {address.full_address}
                      {address.is_default && (
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">Default</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {errors.address_id && (
              <p className="mt-2 text-sm text-red-600">{errors.address_id.message}</p>
            )}
            <Link href="/profile/addresses">
              <Button variant="outline" className="mt-4 w-full">
                Manage Addresses
              </Button>
            </Link>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <CreditCard className="mr-3 text-primary-600" /> Payment Method
            </h2>
            <RadioGroup
              onValueChange={(value: 'card' | 'cod') => {
                setValue('payment_method', value);
                if (value === 'card' && !clientSecret) {
                  createPaymentIntent();
                }
              }}
              value={selectedPaymentMethod}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="card" id="payment-card" />
                <Label htmlFor="payment-card" className="flex-grow cursor-pointer">
                  Credit/Debit Card (via Stripe)
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="cod" id="payment-cod" />
                <Label htmlFor="payment-cod" className="flex-grow cursor-pointer">
                  Cash on Delivery
                </Label>
              </div>
            </RadioGroup>
            {errors.payment_method && (
              <p className="mt-2 text-sm text-red-600">{errors.payment_method.message}</p>
            )}
          </div>

          {/* Scheduled Delivery */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Delivery Options</h2>
            <ScheduledDelivery
              restaurantId={cart.restaurant_id || 0}
              onDeliveryChange={(delivery) => {
                // Store delivery info for order creation
                setValue('delivery_type', delivery.type);
                if (delivery.type === 'scheduled') {
                  setValue('scheduled_date', delivery.date);
                  setValue('time_slot_id', delivery.timeSlotId);
                }
              }}
            />
          </div>

          {/* Delivery Instructions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Delivery Instructions</h2>
            <Textarea
              {...control.register('delivery_instructions')}
              placeholder="e.g., Leave at door, avoid ringing bell..."
              rows={3}
            />
          </div>
        </div>

        {/* Right Column: Order Summary and Place Order */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
            <div className="space-y-3 text-gray-700 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity} x {item.item_name}</span>
                  <span>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{cart.delivery_fee.toFixed(2)}</span>
              </div>
              {/* Add Tax, Discount if applicable */}
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg text-gray-900">
                <span>Total Amount</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {selectedPaymentMethod === 'card' && clientSecret && stripePromise && (
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  orderData={{ address_id: selectedAddressId!, delivery_instructions: data.delivery_instructions }}
                />
              </Elements>
            )}

            {selectedPaymentMethod === 'cod' && (
              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                disabled={placingOrder || !selectedAddressId}
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" /> Place Order (COD)
                  </>
                )}
              </Button>
            )}

            {selectedPaymentMethod === 'card' && !clientSecret && (
              <Button
                type="button"
                size="lg"
                className="w-full mt-6"
                onClick={createPaymentIntent}
                disabled={placingOrder || !selectedAddressId}
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" /> Pay with Card
                  </>
                )}
              </Button>
            )}

          </div>
        </div>
      </form>
    </div>
  );
}
