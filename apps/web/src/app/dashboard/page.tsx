
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

type Address = {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  city: string;
  address: string;
};

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<Profile | null>(
      null
    );

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [city, setCity] =
    useState("");

  const [address, setAddress] =
    useState("");

  useEffect(() => {
    const loadData =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) return;

        // PROFILE
        const {
          data: profileData,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select("*")
            .eq(
              "id",
              user.id
            )
            .single();

        setProfile(
          profileData
        );

        // ADDRESSES
        const {
          data: addressData,
        } =
          await supabase
            .from(
              "addresses"
            )
            .select("*")
            .eq(
              "user_id",
              user.id
            );

        setAddresses(
          addressData ||
            []
        );
      };

    void loadData();
  }, []);

  const saveAddress =
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          full_name: fullName,
          phone,
          country,
          city,
          address,
        });

      setFullName("");
      setPhone("");
      setCountry("");
      setCity("");
      setAddress("");

      // RECARGAR
      const { data } =
        await supabase
          .from(
            "addresses"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          );

      setAddresses(
        data || []
      );
    };

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      window.location.href =
        "/login";
    };

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10 relative overflow-hidden">

      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            👤 Mi Cuenta
          </h1>

          <p className="text-gray-400 text-xl">
            Gestiona tu cuenta y direcciones
          </p>
        </div>

        {/* USER INFO */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[35px] p-10 shadow-[0_0_40px_rgba(34,211,238,0.15)] mb-10">
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

          <div className="flex gap-5 mt-10">
            <a
              href="/stores"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition"
            >
              Ver Tiendas
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

        {/* GRID */}
        <div className="grid lg:grid-cols-2 gap-10">

          {/* FORM */}
          <div className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[35px] p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)]">

            <h2 className="text-4xl font-black mb-8">
              ➕ Nueva dirección
            </h2>

            <div className="space-y-5">

              <input
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none"
              />

              <input
                type="text"
                placeholder="Teléfono"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none"
              />

              <input
                type="text"
                placeholder="País"
                value={country}
                onChange={(e) =>
                  setCountry(
                    e.target.value
                  )
                }
                className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none"
              />

              <input
                type="text"
                placeholder="Ciudad"
                value={city}
                onChange={(e) =>
                  setCity(
                    e.target.value
                  )
                }
                className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none"
              />

              <textarea
                placeholder="Dirección completa"
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none h-32"
              />

              <button
                onClick={
                  saveAddress
                }
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-5 rounded-2xl text-xl font-black hover:scale-105 transition"
              >
                Guardar dirección
              </button>
            </div>
          </div>

          {/* ADDRESSES */}
          <div>
            <h2 className="text-4xl font-black mb-8">
              📦 Mis direcciones
            </h2>

            <div className="space-y-6">
              {addresses.map(
                (
                  item
                ) => (
                  <div
                    key={item.id}
                    className="bg-white/10 border border-white/10 rounded-[30px] p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                  >
                    <h3 className="text-2xl font-black text-cyan-400 mb-3">
                      {
                        item.full_name
                      }
                    </h3>

                    <p className="text-gray-300 mb-2">
                      📞 {
                        item.phone
                      }
                    </p>

                    <p className="text-gray-300 mb-2">
                      🌎 {
                        item.country
                      }
                      ,
                      {
                        item.city
                      }
                    </p>

                    <p className="text-gray-400">
                      {
                        item.address
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}