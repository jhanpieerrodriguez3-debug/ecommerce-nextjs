"use client";

import Link from "next/link";

import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { cart } =
    useCart();

  return (
    <nav className="flex items-center justify-between p-5 border-b">
      <Link
        href="/products"
        className="text-2xl font-bold"
      >
        DigitalMarket
      </Link>

      <Link
        href="/cart"
        className="text-xl"
      >
        Cart (
        {cart.length})
      </Link>
    </nav>
  );
}