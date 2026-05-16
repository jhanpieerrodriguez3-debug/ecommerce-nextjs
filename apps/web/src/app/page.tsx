// =========================
// HOME PAGE - page.tsx
// =========================

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 bg-blue-700 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          DigitalMarket
        </h1>

        <div className="flex gap-6 text-lg">
          <a href="/products" className="hover:text-blue-200 transition">
            Products
          </a>

          <a href="/cart" className="hover:text-blue-200 transition">
            Cart
          </a>

          <a href="/login" className="hover:text-blue-200 transition">
            Iniciar Sesión
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-5">
        <h2 className="text-6xl font-extrabold text-blue-800 mb-6">
          Bienvenido a DigitalMarket
        </h2>

        <p className="text-xl text-gray-700 max-w-3xl mb-8 leading-relaxed">
          DigitalMarket es una plataforma ecommerce moderna desarrollada con Next.js, TypeScript, Tailwind CSS y Supabase. El sistema incluye autenticación, roles de administrador, gestión de productos, carrito de compras y proceso de compra online.
        </p>

        <a
          href="/products"
          className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg transition"
        >
          Explorar Productos
        </a>
      </section>

      {/* About Project */}
      <section className="px-10 py-20 bg-white">
        <h3 className="text-4xl font-bold text-center text-blue-800 mb-14">
          Sobre Nuestro Proyecto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-blue-50 p-8 rounded-3xl shadow-md">
            <h4 className="text-2xl font-bold text-blue-700 mb-4">
              Autenticación
            </h4>

            <p className="text-gray-700 leading-relaxed">
              Los usuarios pueden registrarse, iniciar sesión y acceder a rutas protegidas utilizando Supabase Authentication.
            </p>
          </div>

          <div className="bg-blue-50 p-8 rounded-3xl shadow-md">
            <h4 className="text-2xl font-bold text-blue-700 mb-4">
              Sistema Ecommerce
            </h4>

            <p className="text-gray-700 leading-relaxed">
              Los clientes pueden explorar productos, agregar artículos al carrito y completar compras en una experiencia dinámica.
            </p>
          </div>

          <div className="bg-blue-50 p-8 rounded-3xl shadow-md">
            <h4 className="text-2xl font-bold text-blue-700 mb-4">
              Panel de Administración
            </h4>

            <p className="text-gray-700 leading-relaxed">
              Los administradores pueden crear, editar y eliminar productos utilizando un sistema CRUD completo conectado con Supabase.
            </p>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-20 px-10 bg-blue-700 text-white text-center">
        <h3 className="text-4xl font-bold mb-10">
          Tecnologías Utilizadas
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xl font-semibold">
          <div className="bg-blue-600 p-6 rounded-2xl">
            Next.js
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl">
            TypeScript
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl">
            Tailwind CSS
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl">
            Supabase
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-6">
        <p>
          © 2026 DigitalMarket - Proyecto Ecommerce Fullstack
        </p>
      </footer>
    </main>
  );
}

// =========================
// LOGIN PAGE - login/page.tsx
// =========================

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function Iniciar SesiónPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleIniciar Sesión =
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-400 px-5">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-3">
            DigitalMarket
          </h1>

          <p className="text-gray-600">
            Inicia sesión para continuar comprando
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="border border-gray-300 p-4 rounded-xl w-full mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="border border-gray-300 p-4 rounded-xl w-full mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleIniciar Sesión}
          className="bg-blue-700 hover:bg-blue-800 text-white w-full py-4 rounded-xl text-lg font-semibold transition"
        >
          Iniciar Sesión
        </button>

        <p className="text-center text-gray-500 mt-6">
          Plataforma ecommerce desarrollada con Next.js y Supabase.
        </p>
      </div>
    </main>
  );
}

