"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

type Profile = {
  email?: string;
  role?: string;
};

export default function DashboardPage() {
  const router =
    useRouter();

  const [profile, setProfile] =
    useState<Profile | null>(
      null
    );

  const getProfile =
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push(
          "/login"
        );

        return;
      }

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

  useEffect(() => {
    void getProfile();
  }, []);

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      router.push(
        "/login"
      );
    };

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-6xl font-black mb-3">
            Dashboard
          </h1>

          <p className="text-gray-400 text-xl">
            Bienvenido a tu panel de control
          </p>
        </div>

        {profile ? (
          <>
            {/* CARDS */}
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* PERFIL */}
              <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                <h2 className="text-3xl font-bold mb-6 text-cyan-400">
                  👤 Perfil
                </h2>

                <div className="space-y-4 text-lg">
                  <p>
                    <span className="font-bold">
                      Email:
                    </span>{" "}
                    {
                      profile.email
                    }
                  </p>

                  <p>
                    <span className="font-bold">
                      Rol:
                    </span>{" "}
                    {
                      profile.role
                    }
                  </p>
                </div>
              </div>

              {/* ESTADÍSTICAS */}
              <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                <h2 className="text-3xl font-bold mb-6 text-cyan-400">
                  📊 Actividad
                </h2>

                <div className="space-y-5">
                  <div className="bg-black/30 p-5 rounded-2xl">
                    <p className="text-gray-400">
                      Compras realizadas
                    </p>

                    <h3 className="text-4xl font-black mt-2">
                      12
                    </h3>
                  </div>

                  <div className="bg-black/30 p-5 rounded-2xl">
                    <p className="text-gray-400">
                      Productos vistos
                    </p>

                    <h3 className="text-4xl font-black mt-2">
                      48
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* ADMIN PANEL */}
            {profile.role ===
              "admin" && (
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 rounded-[30px] p-10 mb-10 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
                <h2 className="text-4xl font-black mb-4">
                  🛠️ Admin Panel
                </h2>

                <p className="text-gray-300 text-lg mb-6">
                  Gestiona productos,
                  usuarios y órdenes del ecommerce.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/admin"
                    )
                  }
                  className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-white font-bold text-lg hover:scale-105 transition shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                >
                  Ir al Panel Admin
                </button>
              </div>
            )}

            {/* LOGOUT */}
            <button
              onClick={
                handleLogout
              }
              className="bg-red-600 hover:bg-red-700 transition px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-xl"
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <p className="text-2xl">
            Cargando perfil...
          </p>
        )}
      </div>
    </main>
  );
}