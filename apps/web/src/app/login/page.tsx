"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleLogin =
    async () => {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        return;
      }

      window.location.href =
        "/dashboard";
    };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-400">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
          DigitalMarket
        </h1>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="border p-4 rounded-xl w-full mb-5"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="border p-4 rounded-xl w-full mb-6"
        />

        <button
          onClick={handleLogin}
          className="bg-blue-700 text-white w-full py-4 rounded-xl"
        >
          Iniciar Sesión
        </button>
      </div>
    </main>
  );
}