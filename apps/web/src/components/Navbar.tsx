
"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { cart } =
    useCart();

  const [role, setRole] =
    useState("");

  useEffect(() => {
    const loadUser =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setRole("");

          return;
        }

        const { data } =
          await supabase
            .from("profiles")
            .select("role")
            .eq(
              "id",
              user.id
            )
            .single();

        if (
          data?.role
        ) {
          setRole(
            data.role
          );
        }
      };

    void loadUser();
  }, []);

  const logout =
    async () => {
      await supabase.auth.signOut();

      window.location.href =
        "/login";
    };

  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
      <div className="max-w-7xl mx-auto px-10 py-5 flex justify-between items-center">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            🛒
          </div>

          <div>
            <h1 className="text-3xl font-black text-white">
              Digital
              <span className="text-cyan-400">
                Market
              </span>
            </h1>

            <p className="text-gray-400 text-sm">
              Ecommerce Profesional
            </p>
          </div>
        </Link>

        {/* VISITANTE */}
        {role === "" && (
          <div className="flex gap-5">
            <Link
              href="/login"
              className="text-white hover:text-cyan-400 transition"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 rounded-2xl text-white font-bold"
            >
              Register
            </Link>
          </div>
        )}

        {/* CLIENTE */}
        {role ===
          "client" && (
          <div className="flex items-center gap-6">
            <Link
              href="/stores"
              className="text-white hover:text-cyan-400 transition"
            >
              Tiendas
            </Link>

            <Link
              href="/cart"
              className="relative bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-2xl text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition"
            >
              🛒 Carrito

              {cart.length >
                0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black">
                  {
                    cart.length
                  }
                </span>
              )}
            </Link>

            <Link
              href="/dashboard"
              className="text-white hover:text-cyan-400 transition"
            >
              Mi Cuenta
            </Link>

            <button
              onClick={
                logout
              }
              className="bg-red-600 px-5 py-3 rounded-2xl text-white font-bold hover:bg-red-700 transition"
            >
              Salir
            </button>
          </div>
        )}

        {/* ADMIN */}
        {role ===
          "admin" && (
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-2xl text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition"
            >
              🛠️ Admin Panel
            </Link>

            <Link
              href="/dashboard"
              className="text-white hover:text-cyan-400 transition"
            >
              Mi Cuenta
            </Link>

            <button
              onClick={
                logout
              }
              className="bg-red-600 px-5 py-3 rounded-2xl text-white font-bold hover:bg-red-700 transition"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

