'use client';

import { useState, useEffect, useCallback } from 'react';
import { logCartActivity } from '@/utils/userActivityLogger';

export interface CartItem {
  id: string;
  productId: string;
  listingId: string;
  sellerId: string;
  sellerType: 'FARMER' | 'DISTRIBUTOR' | 'AGRO_VET';
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  unit: string;
  images: string[];
  category: string;
  location: string;
  harvestDate?: Date;
  expiryDate?: Date;
  certifications: string[];
  addedAt: Date;
  updatedAt: Date;
}

export interface LikedItem {
  id: string;
  productId: string;
  listingId: string;
  likedAt: Date;
}

interface CartState {
  items: CartItem[];
  likedItems: LikedItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CART_STORAGE_KEY = 'lovitti-agro-cart';
const LIKED_STORAGE_KEY = 'lovitti-agro-liked';

export function useCart() {
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    likedItems: [],
    totalItems: 0,
    totalPrice: 0,
    isLoading: false, // Start with false to avoid loading state issues
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      setCartState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedLiked = localStorage.getItem(LIKED_STORAGE_KEY);
      
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCartState(prev => ({
          ...prev,
          items: cartData.items || [],
          totalItems: cartData.totalItems || 0,
          totalPrice: cartData.totalPrice || 0,
        }));
      }
      
      if (savedLiked) {
        const likedData = JSON.parse(savedLiked);
        setCartState(prev => ({
          ...prev,
          likedItems: likedData || [],
        }));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setCartState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!cartState.isLoading && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
          items: cartState.items,
          totalItems: cartState.totalItems,
          totalPrice: cartState.totalPrice,
        }));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartState.items, cartState.totalItems, cartState.totalPrice, cartState.isLoading]);

  // Save liked items to localStorage whenever it changes
  useEffect(() => {
    if (!cartState.isLoading && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(cartState.likedItems));
      } catch (error) {
        console.error('Error saving liked items to localStorage:', error);
      }
    }
  }, [cartState.likedItems, cartState.isLoading]);

  // Add item to cart
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    // Log cart activity (using mock user data for now since auth is disabled)
    const mockUserId = 'user-' + Date.now();
    const mockUserRole = 'BUYER';
    const mockUserEmail = 'user@example.com';
    
    logCartActivity(mockUserId, mockUserRole, mockUserEmail, 'CART_ADD', {
      productId: item.productId,
      listingId: item.listingId,
      sellerId: item.sellerId,
      sellerType: item.sellerType,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
      category: item.category,
      timestamp: new Date().toISOString()
    });

    setCartState(prev => {
      // Check if item already exists in cart
      const existingItem = prev.items.find(cartItem => 
        cartItem.productId === item.productId && cartItem.listingId === item.listingId
      );

      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = prev.items.map(cartItem =>
          cartItem.id === existingItem.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + item.quantity,
                updatedAt: new Date(),
              }
            : cartItem
        );

        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
          ...prev,
          items: updatedItems,
          totalItems,
          totalPrice,
        };
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          ...item,
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedItems = [...prev.items, newItem];
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
          ...prev,
          items: updatedItems,
          totalItems,
          totalPrice,
        };
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    setCartState(prev => {
      // Find the item being removed for logging
      const removedItem = prev.items.find(item => item.id === itemId);
      
      // Log cart activity if item found
      if (removedItem) {
        const mockUserId = 'user-' + Date.now();
        const mockUserRole = 'BUYER';
        const mockUserEmail = 'user@example.com';
        
        logCartActivity(mockUserId, mockUserRole, mockUserEmail, 'CART_REMOVE', {
          productId: removedItem.productId,
          listingId: removedItem.listingId,
          sellerId: removedItem.sellerId,
          sellerType: removedItem.sellerType,
          productName: removedItem.name,
          quantity: removedItem.quantity,
          price: removedItem.price,
          currency: removedItem.currency,
          category: removedItem.category,
          timestamp: new Date().toISOString()
        });
      }

      const updatedItems = prev.items.filter(item => item.id !== itemId);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...prev,
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartState(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === itemId
          ? { ...item, quantity, updatedAt: new Date() }
          : item
      );

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...prev,
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    });
  }, [removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCartState(prev => ({
      ...prev,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    }));
  }, []);

  // Toggle like status
  const toggleLike = useCallback((productId: string, listingId: string) => {
    setCartState(prev => {
      const existingLike = prev.likedItems.find(like => 
        like.productId === productId && like.listingId === listingId
      );

      if (existingLike) {
        // Remove like
        return {
          ...prev,
          likedItems: prev.likedItems.filter(like => like.id !== existingLike.id),
        };
      } else {
        // Add like
        const newLike: LikedItem = {
          id: `like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId,
          listingId,
          likedAt: new Date(),
        };

        return {
          ...prev,
          likedItems: [...prev.likedItems, newLike],
        };
      }
    });
  }, []);

  // Check if item is in cart
  const isInCart = useCallback((productId: string, listingId: string) => {
    return cartState.items.some(item => 
      item.productId === productId && item.listingId === listingId
    );
  }, [cartState.items]);

  // Check if item is liked
  const isLiked = useCallback((productId: string, listingId: string) => {
    return cartState.likedItems.some(like => 
      like.productId === productId && like.listingId === listingId
    );
  }, [cartState.likedItems]);

  // Get cart item by product and listing ID
  const getCartItem = useCallback((productId: string, listingId: string) => {
    return cartState.items.find(item => 
      item.productId === productId && item.listingId === listingId
    );
  }, [cartState.items]);

  return {
    // State
    items: cartState.items,
    likedItems: cartState.likedItems,
    totalItems: cartState.totalItems,
    totalPrice: cartState.totalPrice,
    isLoading: cartState.isLoading,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleLike,
    
    // Helpers
    isInCart,
    isLiked,
    getCartItem,
  };
}
