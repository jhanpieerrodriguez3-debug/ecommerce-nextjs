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
  useState<Array<Product>>([]);

  useEffect(() => {
    const storedCart =
      localStorage.getItem(
        "cart"
      );

    if (storedCart) {
      setCart(
  JSON.parse(
    storedCart
  ) as Product[]
);
    }
  }, []);

  const addToCart = (
    product: Product
  ) => {
    const updatedCart = [
      ...cart,
      product,
    ];

    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );
  };

  const removeFromCart = (
    index: number
  ) => {
    const updatedCart =
      cart.filter(
        (
          _: Product,
          i: number
        ) => i !== index
      );

    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return context;
}