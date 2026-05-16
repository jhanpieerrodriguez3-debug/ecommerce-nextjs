"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Profile = {
  email?: string;
  role?: string;
};

export default function DashboardPage() {
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
            .from("profiles")
            .select("*")
            .eq(
              "id",
              user.id
            )
            .single();

        setProfile(data);
      };

    getProfile();
  }, []);

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      window.location.href =
        "/login";
    };

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            👤 Mi Cuenta
          </h1>

          <p className="text-gray-400 text-xl">
            Gestiona tu cuenta y tus compras
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-10 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
          <h2 className="text-3xl font-black text-cyan-400 mb-8">
            Información del usuario
          </h2>

          <div className="space-y-5 text-xl">
            <p>
              <span className="font-bold text-cyan-400">
                Email:
              </span>{" "}
              {profile?.email}
            </p>

            <p>
              <span className="font-bold text-cyan-400">
                Rol:
              </span>{" "}
              {profile?.role}
            </p>
          </div>

          {/* BOTONES */}
          <div className="flex gap-5 mt-10">
            <a
              href="/products"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition"
            >
              Ver Productos
            </a>

            <a
              href="/cart"
              className="border border-cyan-400 px-8 py-4 rounded-2xl font-bold hover:bg-cyan-400 hover:text-black transition"
            >
              Mi Carrito
            </a>

            <button
              onClick={
                handleLogout
              }
              className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl font-bold transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}