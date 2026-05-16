
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

        console.log("USER:", user.id);
console.log("ROLE DATA:", data);

if (data?.role) {
  setRole(data.role);
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
    <nav className="bg-black border-b border-cyan-500/20 text-white">
      <div className="max-w-7xl mx-auto px-10 py-5 flex justify-between items-center">
        {/* LOGO */}
        <Link
          href="/"
          className="text-3xl font-black"
        >
          Digital
          <span className="text-cyan-400">
            Market
          </span>
        </Link>

        {/* VISITANTE */}
        {role === "" && (
          <div className="flex gap-5">
            <Link href="/login">
              Login
            </Link>

            <Link
              href="/register"
              className="bg-cyan-500 px-5 py-2 rounded-xl"
            >
              Register
            </Link>
          </div>
        )}

        {/* CLIENTE */}
        {role ===
          "client" && (
          <div className="flex items-center gap-6">
            <Link href="/stores">
              Tiendas
            </Link>

            <Link href="/cart">
              Carrito (
              {
                cart.length
              }
              )
            </Link>

            <button
              onClick={logout}
              className="bg-red-600 px-5 py-2 rounded-xl"
            >
              Salir
            </button>
          </div>
        )}

        {/* ADMIN */}
        {role ===
          "admin" && (
          <div className="flex items-center gap-6">
            <Link href="/admin">
              Admin Panel
            </Link>

            <button
              onClick={logout}
              className="bg-red-600 px-5 py-2 rounded-xl"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

