"use client";

import {
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const handleLogin =
    async (): Promise<void> => {
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

      window.location.href =
        "/dashboard";
    };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-400 p-5">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl">
        <h1 className="text-5xl font-bold text-center text-blue-700 mb-3">
          DigitalMarket
        </h1>

        <p className="text-center text-gray-600 mb-10">
          Inicia sesión para continuar
        </p>

        <div className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="border border-gray-300 p-4 rounded-2xl outline-none focus:border-blue-700"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="border border-gray-300 p-4 rounded-2xl outline-none focus:border-blue-700"
          />

          <button
            onClick={
              handleLogin
            }
            className="bg-blue-700 text-white py-4 rounded-2xl text-lg font-bold hover:bg-blue-800 transition"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </main>
  );
}