import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  suggestions?: string[];
  imageUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  shopId: string | null;
  shopName: string | null;
  addItem: (item: CartItem, shopId: string, shopName: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  const addItem = (item: CartItem, sid: string, sName: string) => {
    if (shopId && shopId !== sid) {
      setItems([item]);
      setShopId(sid);
      setShopName(sName);
      return;
    }
    setShopId(sid);
    setShopName(sName);
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.productId !== productId);
      if (updated.length === 0) {
        setShopId(null);
        setShopName(null);
      }
      return updated;
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity: qty } : i
    ));
  };

  const clearCart = () => {
    setItems([]);
    setShopId(null);
    setShopName(null);
  };

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + (i.price * i.quantity), 0), [items]);

  const value = useMemo(() => ({
    items, shopId, shopName,
    addItem, removeItem, updateQuantity, clearCart,
    totalItems, totalAmount,
  }), [items, shopId, shopName, totalItems, totalAmount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
