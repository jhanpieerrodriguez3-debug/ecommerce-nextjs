"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import { useCart } from "@/context/CartContext";

type Profile = {
  role?: string;
};

export default function Navbar() {
  const { cart } =
    useCart();

  const [profile, setProfile] =
    useState<Profile | null>(
      null
    );

  useEffect(() => {
    const getProfile =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) return;

        const { data } =
          await supabase
            .from(
              "profiles"
            )
            .select("role")
            .eq(
              "id",
              user.id
            )
            .single();

        setProfile(data);
      };

    getProfile();
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
      <div className="max-w-7xl mx-auto px-10 py-5 flex justify-between items-center">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(34,211,238,0.7)]">
            🛍️
          </div>

          <div>
            <h1 className="text-3xl font-black text-white">
              Digital
              <span className="text-cyan-400">
                Market
              </span>
            </h1>

            <p className="text-gray-400 text-sm">
              Tu tienda online
            </p>
          </div>
        </Link>

        {/* MENU */}
        <div className="flex items-center gap-6">
          {/* INICIO */}
          <Link
            href="/"
            className="text-white hover:text-cyan-400 transition text-lg"
          >
            Inicio
          </Link>

          {/* VISITANTE */}
          {!profile && (
            <>
              <Link
                href="/login"
                className="text-white hover:text-cyan-400 transition text-lg"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-2xl text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 transition"
              >
                Register
              </Link>
            </>
          )}

          {/* CLIENTE */}
          {profile?.role ===
            "client" && (
            <>
              <Link
                href="/products"
                className="text-white hover:text-cyan-400 transition text-lg"
              >
                Productos
              </Link>

              <Link
                href="/dashboard"
                className="text-white hover:text-cyan-400 transition text-lg"
              >
                Mi Panel
              </Link>

              <Link
                href="/cart"
                className="bg-white/10 border border-cyan-400/30 px-5 py-3 rounded-2xl text-white hover:bg-cyan-400 hover:text-black transition shadow-xl"
              >
                🛒 Carrito (
                {
                  cart.length
                }
                )
              </Link>
            </>
          )}

          {/* ADMIN */}
          {profile?.role ===
            "admin" && (
            <>
              <Link
                href="/admin"
                className="text-white hover:text-cyan-400 transition text-lg"
              >
                Admin Panel
              </Link>

              <Link
                href="/dashboard"
                className="text-white hover:text-cyan-400 transition text-lg"
              >
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}