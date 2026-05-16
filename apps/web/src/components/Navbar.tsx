"use client";

import Link from "next/link";

import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { cart } =
    useCart();

  return (
    <nav className="bg-blue-700 text-white px-10 py-5 flex justify-between items-center shadow-lg">
      {/* Logo */}
      <Link
        href="/"
        className="text-3xl font-bold"
      >
        DigitalMarket
      </Link>

      {/* Menu */}
      <div className="flex gap-8 text-lg items-center">
        <Link href="/">
          Inicio
        </Link>

        <Link href="/products">
          Productos
        </Link>

        <Link href="/dashboard">
          Dashboard
        </Link>

        <Link href="/cart">
          🛒 Carrito (
          {cart.length})
        </Link>

        <Link
          href="/login"
          className="bg-white text-blue-700 px-5 py-2 rounded-xl font-bold"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}