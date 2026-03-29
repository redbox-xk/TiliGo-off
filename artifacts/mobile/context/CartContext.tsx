import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  basePrice: number;
  deliveryPrice: number;
  quantity: number;
  suggestions?: string[];
  imageUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  shopId: string | null;
  shopName: string | null;
  addItem: (item: CartItem, shopId: string, shopName: string) => 'added' | 'shop_changed';
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  deliveryTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  const addItem = useCallback((item: CartItem, sid: string, sName: string): 'added' | 'shop_changed' => {
    if (shopId && shopId !== sid) {
      setItems([{ ...item, quantity: 1 }]);
      setShopId(sid);
      setShopName(sName);
      return 'shop_changed';
    }
    setShopId(sid);
    setShopName(sName);
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
        );
      }
      return [...prev, item];
    });
    return 'added';
  }, [shopId]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.productId !== productId);
      if (updated.length === 0) { setShopId(null); setShopName(null); }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]); setShopId(null); setShopName(null);
  }, []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.basePrice * i.quantity), 0), [items]);
  const deliveryTotal = useMemo(() => items.reduce((s, i) => s + (i.deliveryPrice * i.quantity), 0), [items]);

  const value = useMemo(() => ({
    items, shopId, shopName, addItem, removeItem, updateQuantity, clearCart,
    totalItems, totalAmount, deliveryTotal,
  }), [items, shopId, shopName, totalItems, totalAmount, deliveryTotal, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
