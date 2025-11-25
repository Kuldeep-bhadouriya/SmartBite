import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AddToCartPayload {
  menu_item_id: number;
  quantity: number;
  special_instructions?: string;
}

interface UpdateCartItemPayload {
  quantity?: number;
  special_instructions?: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
  item_name?: string;
  item_image?: string;
  item_description?: string;
}

export interface CartResponse {
  id: number;
  user_id: number;
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant_logo?: string;
  items: CartItem[];
  total_items: number;
  subtotal: number;
  delivery_fee: number;
  minimum_order: number;
}

interface CartState {
  cart: CartResponse | null;
  totalItems: number;
  isLoading: boolean;
  
  fetchCart: () => Promise<void>;
  addToCart: (itemData: AddToCartPayload) => Promise<void>;
  updateCartItem: (itemId: number, itemData: UpdateCartItemPayload) => Promise<void>;
  removeCartItem: (itemId: number) => Promise<void>;
  clearUserCart: () => Promise<void>;
  updateCartStore: (cartData: CartResponse | null) => void;
  clearCartStore: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      totalItems: 0,
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const response = await cartApi.get();
          const cartData = response.data as CartResponse;
          set({
            cart: cartData,
            totalItems: cartData.total_items,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          // If cart is empty or user is not logged in, it might return 404 or 401
          // We can just set cart to null in that case
          if (error.response?.status === 404 || error.response?.status === 401) {
            set({ cart: null, totalItems: 0 });
          } else {
            console.error('Failed to fetch cart:', error);
            toast.error('Failed to load cart. Please try again.');
          }
        }
      },

      addToCart: async (itemData: AddToCartPayload) => {
        set({ isLoading: true });
        try {
          const response = await cartApi.addItem(itemData.menu_item_id, itemData.quantity, itemData.special_instructions);
          const cartData = response.data as CartResponse;
          set({
            cart: cartData,
            totalItems: cartData.total_items,
            isLoading: false,
          });
          toast.success('Item added to cart!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Failed to add item to cart.');
          throw error;
        }
      },

      updateCartItem: async (itemId: number, itemData: UpdateCartItemPayload) => {
        set({ isLoading: true });
        try {
          const response = await cartApi.updateItem(itemId, itemData.quantity || 1);
          const cartData = response.data as CartResponse;
          set({
            cart: cartData,
            totalItems: cartData.total_items,
            isLoading: false,
          });
          toast.success('Cart item updated!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Failed to update cart item.');
          throw error;
        }
      },

      removeCartItem: async (itemId: number) => {
        set({ isLoading: true });
        try {
          const response = await cartApi.removeItem(itemId);
          const cartData = response.data as CartResponse;
          set({
            cart: cartData,
            totalItems: cartData.total_items,
            isLoading: false,
          });
          toast.success('Item removed from cart!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Failed to remove cart item.');
          throw error;
        }
      },

      clearUserCart: async () => {
        set({ isLoading: true });
        try {
          await cartApi.clear();
          set({
            cart: null,
            totalItems: 0,
            isLoading: false,
          });
          toast.success('Cart cleared!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Failed to clear cart.');
          throw error;
        }
      },

      updateCartStore: (cartData: CartResponse | null) => {
        set({ cart: cartData, totalItems: cartData?.total_items || 0 });
      },

      clearCartStore: () => {
        set({ cart: null, totalItems: 0 });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        // Only persist totalItems for display in UI like Navbar cart icon
        totalItems: state.totalItems,
      }),
    }
  )
);