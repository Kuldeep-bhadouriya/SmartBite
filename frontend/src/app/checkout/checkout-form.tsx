'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { orderApi, paymentApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
  clientSecret: string;
  orderData: {
    address_id: number;
    delivery_instructions?: string;
  };
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, orderData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearUserCart } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    // First, create the order in your backend
    try {
      const orderResponse = await orderApi.create({
        address_id: orderData.address_id,
        order_type: 'delivery',
        delivery_instructions: orderData.delivery_instructions,
        payment_method: 'card',
      });

      const orderId = orderResponse.data.id;

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-success?orderId=${orderId}`, // Redirect to success page
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          toast.error(stripeError.message);
        } else {
          toast.error('An unexpected error occurred.');
        }
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment in your backend
        await paymentApi.confirm(orderId, paymentIntent.id);
        toast.success('Payment successful and order placed!');
        clearUserCart();
        router.push(`/order-success?orderId=${orderId}`);
      } else {
        toast.error('Payment failed or was not successful.');
        setIsLoading(false);
      }
    } catch (apiError: any) {
      toast.error(apiError.response?.data?.detail || 'Failed to place order or confirm payment.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button
        type="submit"
        size="lg"
        className="w-full mt-6"
        disabled={isLoading || !stripe || !elements || !clientSecret}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" /> Pay Now
          </>
        )}
      </Button>
    </form>
  );
};

export default CheckoutForm;
