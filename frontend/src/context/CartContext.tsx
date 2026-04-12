import {
  clearServerCart,
  fetchServerCart,
  removeServerCartItem,
  upsertServerCartItem
} from "@/api/client";
import type {AuthUser} from "@/types/auth";
import type {CartItem, CartResponse} from "@/types/cart";
import type {Product} from "@/types/product";
import type {ReactNode} from "react";
import {createContext, useContext, useEffect, useMemo, useState} from "react";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  setItemQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartProviderProps = {
  authUser: AuthUser | null;
  children: ReactNode;
};

export function CartProvider({authUser, children}: CartProviderProps) {
  const [cart, setCart] = useState<CartResponse>(() => emptyCart());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void synchronizeByAuth();
  }, [authUser?.id]);

  async function synchronizeByAuth() {
    const isAuthenticated = Boolean(authUser);
    setLoading(true);
    try {
      if (isAuthenticated && authUser) {
        const serverCart = await fetchServerCart();
        setCart(serverCart);
      } else {
        setCart(emptyCart());
      }
    } catch {
      if (!isAuthenticated) {
        setCart(emptyCart());
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshCart() {
    if (!authUser) {
      setCart(emptyCart());
      return;
    }
    setLoading(true);
    try {
      const data = await fetchServerCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(product: Product, quantity = 1) {
    if (quantity <= 0) {
      return;
    }
    if (!authUser) {
      return;
    }

    const current = cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;
    const nextQuantity = Math.min(current + quantity, 999);
    const data = await upsertServerCartItem(product.id, nextQuantity);
    setCart(data);
  }

  async function setItemQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    if (authUser) {
      const data = await upsertServerCartItem(productId, Math.min(quantity, 999));
      setCart(data);
      return;
    }

    setCart(emptyCart());
  }

  async function removeItem(productId: number) {
    if (authUser) {
      const data = await removeServerCartItem(productId);
      setCart(data);
      return;
    }
    setCart(emptyCart());
  }

  async function clearCart() {
    if (authUser) {
      await clearServerCart();
      setCart(emptyCart());
      return;
    }
    setCart(emptyCart());
  }

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart.items,
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      loading,
      addToCart,
      setItemQuantity,
      removeItem,
      clearCart,
      refreshCart
    }),
    [cart, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}

function emptyCart(): CartResponse {
  return {
    items: [],
    totalItems: 0,
    subtotal: 0
  };
}
