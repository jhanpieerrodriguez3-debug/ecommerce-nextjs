
"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router =
    useRouter();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const handleLogin =
    async () => {
      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (error) {
        alert(
          error.message
        );

        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) return;

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
        data?.role ===
        "admin"
      ) {
        router.push(
          "/admin"
        );
      } else {
        router.push(
          "/stores"
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#050816] flex items-center justify-center px-5 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      {/* CARD */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-[0_0_50px_rgba(34,211,238,0.2)] relative z-10">
        {/* TITLE */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-4xl mx-auto mb-5 shadow-[0_0_30px_rgba(34,211,238,0.7)]">
            🛍️
          </div>

          <h1 className="text-5xl font-black text-white mb-3">
            Bienvenido
          </h1>

          <p className="text-gray-400">
            Inicia sesión en DigitalMarket
          </p>
        </div>

        {/* EMAIL */}
        <div className="mb-5">
          <label className="text-white block mb-2">
            Correo
          </label>

          <input
            type="email"
            placeholder="correo@gmail.com"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-8">
          <label className="text-white block mb-2">
            Contraseña
          </label>

          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={
            handleLogin
          }
          className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-xl font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 transition duration-300"
        >
          Iniciar Sesión
        </button>

        {/* REGISTER */}
        <p className="text-center text-gray-400 mt-8">
          ¿No tienes cuenta?{" "}

          <Link
            href="/register"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}

