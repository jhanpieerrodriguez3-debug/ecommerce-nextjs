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
};

type CartContextType = {
  cart: Product[];

  addToCart: (
    product: Product
  ) => void;

  removeFromCart: (
    index: number
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
      const parsedCart: Product[] =
        JSON.parse(storedCart);

      setCart(parsedCart);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (
    product: Product
  ) => {
    setCart((prev) => [
      ...prev,
      product,
    ]);
  };

  const removeFromCart = (
    index: number
  ) => {
    setCart((prev) =>
      prev.filter(
        (
          _,
          i
        ) => i !== index
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