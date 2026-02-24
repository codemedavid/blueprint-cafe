import { useState, useCallback } from 'react';
import { CartItem, MenuItem, Variation, AddOn } from '../types';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const calculateItemPrice = (item: MenuItem, variations?: Variation[], addOns?: AddOn[]) => {
    let price = item.basePrice;
    if (variations) {
      variations.forEach(v => { price += v.price; });
    }
    if (addOns) {
      addOns.forEach(addOn => {
        price += addOn.price;
      });
    }
    return price;
  };

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, variations?: Variation | Variation[], addOns?: AddOn[]) => {
    // Accept both a single Variation (legacy) and Variation[] (multi-type)
    const variationsArray: Variation[] = variations
      ? Array.isArray(variations) ? variations : [variations]
      : [];

    const totalPrice = calculateItemPrice(item, variationsArray, addOns);

    // Group add-ons by name and sum their quantities
    const groupedAddOns = addOns?.reduce((groups, addOn) => {
      const existing = groups.find(g => g.id === addOn.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        groups.push({ ...addOn, quantity: 1 });
      }
      return groups;
    }, [] as (AddOn & { quantity: number })[]);

    const variationsKey = variationsArray.map(v => v.id).sort().join(',') || 'default';

    setCartItems(prev => {
      const existingItem = prev.find(cartItem => {
        const cartVarsKey = (cartItem.selectedVariations || (cartItem.selectedVariation ? [cartItem.selectedVariation] : []))
          .map(v => v.id).sort().join(',') || 'default';
        return (
          cartItem.id === item.id &&
          cartVarsKey === variationsKey &&
          JSON.stringify(cartItem.selectedAddOns?.map(a => `${a.id}-${a.quantity || 1}`).sort()) ===
            JSON.stringify(groupedAddOns?.map(a => `${a.id}-${a.quantity}`).sort())
        );
      });

      if (existingItem) {
        return prev.map(cartItem =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        const uniqueId = `${item.id}-${variationsKey}-${addOns?.map(a => a.id).join(',') || 'none'}`;
        return [...prev, {
          ...item,
          id: uniqueId,
          quantity,
          selectedVariation: variationsArray[0],       // first for backward compat
          selectedVariations: variationsArray,
          selectedAddOns: groupedAddOns || [],
          totalPrice
        }];
      }
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    openCart,
    closeCart
  };
};