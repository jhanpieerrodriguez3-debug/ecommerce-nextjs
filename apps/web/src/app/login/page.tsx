"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin =
  async () => {
    const {
      data,
      error,
    } =
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
      data: profile,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        data.user.id
      )
      .single();

    if (
      profile?.role ===
      "admin"
    ) {
      window.location.href =
        "/admin";
    } else {
      window.location.href =
        "/products";
    }
  };
  const handleRegister = async () => {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    console.log(data);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Usuario registrado");
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-[400px] border p-10 rounded-xl">
        <h1 className="text-3xl font-bold mb-5">
          DigitalMarket Auth
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-5"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={handleLogin}
          className="bg-black text-white px-4 py-2 w-full mb-3"
        >
          Login
        </button>

        <button
          onClick={handleRegister}
          className="bg-green-600 text-white px-4 py-2 w-full"
        >
          Register
        </button>
      </div>
    </main>
  );
}