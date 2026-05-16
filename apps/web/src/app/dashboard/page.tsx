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

  const getProfile =
    async (): Promise<void> => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) return;

      const { data, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (error) {
        console.log(error);
        return;
      }

      setProfile(data);
    };

  useEffect(() => {
    const fetchProfile =
      async () => {
        await getProfile();
      };

    fetchProfile();
  }, []);

  const handleLogout =
    async (): Promise<void> => {
      await supabase.auth.signOut();

      window.location.href =
        "/login";
    };

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-xl">
        <h1 className="text-5xl font-bold text-blue-700 mb-8">
          Dashboard
        </h1>

        {profile ? (
          <div>
            <div className="space-y-3 mb-8">
              <p className="text-xl">
                <span className="font-bold">
                  Email:
                </span>{" "}
                {profile.email}
              </p>

              <p className="text-xl">
                <span className="font-bold">
                  Role:
                </span>{" "}
                {profile.role}
              </p>
            </div>

            {profile.role ===
              "admin" && (
              <div className="bg-blue-100 p-6 rounded-2xl mb-8">
                <h2 className="text-3xl font-bold text-blue-700 mb-3">
                  Panel de Administración
                </h2>

                <p className="text-gray-700 mb-5">
                  Desde aquí puedes administrar los productos del ecommerce.
                </p>

                <a
                  href="/admin"
                  className="bg-blue-700 text-white px-6 py-3 rounded-xl"
                >
                  Ir al Panel Admin
                </a>
              </div>
            )}

            <div className="flex gap-5">
              <a
                href="/products"
                className="bg-green-600 text-white px-6 py-3 rounded-xl"
              >
                Ver Productos
              </a>

              <a
                href="/cart"
                className="bg-yellow-500 text-white px-6 py-3 rounded-xl"
              >
                Ver Carrito
              </a>

              <button
                onClick={
                  handleLogout
                }
                className="bg-red-600 text-white px-6 py-3 rounded-xl"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xl">
            Cargando perfil...
          </p>
        )}
      </div>
    </main>
  );
}