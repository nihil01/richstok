import type {AuthUser} from "@/types/auth";
import type {Product} from "@/types/product";
import type {WishlistItem} from "@/types/wishlist";
import type {ReactNode} from "react";
import {createContext, useContext, useEffect, useMemo, useState} from "react";

const WISHLIST_STORAGE_PREFIX = "richstok-wishlist-user";

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (product: Product) => void;
  removeWishlistItem: (productId: number) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

type WishlistProviderProps = {
  authUser: AuthUser | null;
  children: ReactNode;
};

export function WishlistProvider({authUser, children}: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const storageKey = authUser ? buildStorageKey(authUser.id) : null;

  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      return;
    }
    setItems(readWishlist(storageKey));
  }, [storageKey]);

  function isWishlisted(productId: number) {
    return items.some((item) => item.id === productId);
  }

  function toggleWishlist(product: Product) {
    if (!storageKey) {
      return;
    }
    setItems((previous) => {
      const exists = previous.some((item) => item.id === product.id);
      const nextItems = exists
        ? previous.filter((item) => item.id !== product.id)
        : [toWishlistItem(product), ...previous];
      writeWishlist(storageKey, nextItems);
      return nextItems;
    });
  }

  function removeWishlistItem(productId: number) {
    if (!storageKey) {
      return;
    }
    setItems((previous) => {
      const nextItems = previous.filter((item) => item.id !== productId);
      writeWishlist(storageKey, nextItems);
      return nextItems;
    });
  }

  function clearWishlist() {
    if (!storageKey) {
      setItems([]);
      return;
    }
    setItems([]);
    writeWishlist(storageKey, []);
  }

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      isWishlisted,
      toggleWishlist,
      removeWishlistItem,
      clearWishlist
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider.");
  }
  return context;
}

function toWishlistItem(product: Product): WishlistItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    oemNumber: product.oemNumber,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.price,
    stockQuantity: product.stockQuantity,
    stockState: product.stockState,
    model: product.model ?? null,
    brand: product.brand,
    bakuCount: product.bakuCount ?? null,
    bakuCountUnknown: product.bakuCountUnknown,
    ganjaCount: product.ganjaCount ?? null,
    ganjaCountUnknown: product.ganjaCountUnknown,
    deliveryDays: product.deliveryDays ?? null,
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

function readWishlist(storageKey: string): WishlistItem[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as WishlistItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => typeof item?.id === "number" && item.id > 0)
      .map((item) => ({
        ...item,
        bakuCount: item.bakuCount ?? null,
        bakuCountUnknown: item.bakuCountUnknown ?? false,
        ganjaCount: item.ganjaCount ?? null,
        ganjaCountUnknown: item.ganjaCountUnknown ?? false,
        deliveryDays: item.deliveryDays ?? null
      }));
  } catch {
    return [];
  }
}

function writeWishlist(storageKey: string, items: WishlistItem[]) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function buildStorageKey(userId: number) {
  return `${WISHLIST_STORAGE_PREFIX}:${userId}`;
}
