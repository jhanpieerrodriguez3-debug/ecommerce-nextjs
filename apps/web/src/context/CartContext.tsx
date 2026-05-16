
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Product = {
  id: number;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  cart: Product[];

  addToCart: (
    product: Omit<
      Product,
      "quantity"
    >
  ) => void;

  removeFromCart: (
    id: number
  ) => void;

  increaseQuantity: (
    id: number
  ) => void;

  decreaseQuantity: (
    id: number
  ) => void;

  clearCart: () => void;
};

const CartContext =
  createContext<CartContextType | null>(
    null
  );

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] =
    useState<Product[]>([]);

  useEffect(() => {
    const storedCart =
      localStorage.getItem(
        "cart"
      );

    if (storedCart) {
      setCart(
        JSON.parse(
          storedCart
        )
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (
    product: Omit<
      Product,
      "quantity"
    >
  ) => {
    setCart((prev) => {
      const existing =
        prev.find(
          (item) =>
            item.id ===
            product.id
        );

      if (existing) {
        return prev.map(
          (item) =>
            item.id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (
    id: number
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  const increaseQuantity = (
    id: number
  ) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity +
                1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (
    id: number
  ) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity -
                1,
            }
          : item
      )
    );
  };

  const clearCart =
    () => {
      setCart([]);
    };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart debe usarse dentro de CartProvider"
    );
  }

  return context;
}

