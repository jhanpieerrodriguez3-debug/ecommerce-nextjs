"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { dbService, Profile } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sincronizar perfil en cada cambio de ruta (evita el interval/leak)
  const syncProfile = useCallback(async () => {
    const activeUser = await dbService.getCurrentProfile();
    setProfile(activeUser);
  }, []);

  useEffect(() => {
    void syncProfile();
  }, [pathname, syncProfile]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar fallo de conexión
    }
    dbService.setCurrentProfile(null);
    setProfile(null);
    clearCart();
    showToast("Sesión cerrada correctamente", "info");

    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(34,211,238,0.05)]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex justify-between items-center">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            🏪
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white leading-none">
              Digital<span className="text-cyan-400">Market</span>
            </h1>
            <p className="text-gray-500 text-[10px] tracking-widest uppercase">
              SaaS de Almacenes
            </p>
          </div>
        </Link>

        {/* VISITANTE */}
        {!profile && (
          <div className="flex gap-4 items-center">
            <Link
              href="/login"
              className="text-gray-300 hover:text-cyan-400 transition text-sm font-semibold tracking-wide"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-[1.03] transition shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              Registrarse
            </Link>
          </div>
        )}

        {/* CLIENTE LOGUEADO */}
        {profile && profile.role === "client" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/stores"
              className="text-gray-300 hover:text-cyan-400 transition text-sm font-semibold"
            >
              🏪 Almacenes
            </Link>

            <Link
              href="/cart"
              className="relative bg-gradient-to-r from-cyan-400/20 to-blue-600/20 border border-cyan-500/30 px-5 py-2.5 rounded-xl text-cyan-300 font-bold hover:bg-cyan-500/20 transition flex items-center gap-2 text-sm shadow-[0_0_10px_rgba(34,211,238,0.05)]"
            >
              🛒 Mi Carrito
              {cart.length > 0 && (
                <span className="bg-cyan-400 text-black text-xs font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-cyan-400 transition text-sm font-semibold flex items-center gap-2"
            >
              👤 Mi Cuenta
            </Link>

            <div className="h-6 w-[1px] bg-white/10" />

            <div className="text-right">
              <p className="text-xs text-cyan-400 font-bold leading-none">{profile.full_name || "Cliente"}</p>
              <p className="text-[10px] text-gray-500">{profile.email}</p>
            </div>

            <NotificationBell userId={profile.id} />

            <button
              onClick={() => void logout()}
              className="bg-red-950/40 border border-red-500/30 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-red-400 text-xs font-bold transition cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}

        {/* SUPER_ADMIN LOGUEADO */}
        {profile && profile.role === "super_admin" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/super-admin"
              className="bg-gradient-to-r from-purple-500/20 to-indigo-600/20 border border-purple-500/30 px-5 py-2.5 rounded-xl text-purple-300 font-bold hover:bg-purple-500/20 transition text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(168,85,247,0.05)]"
            >
              🛡️ Panel Super Admin
            </Link>

            <div className="h-6 w-[1px] bg-white/10" />

            <div className="text-right">
              <p className="text-xs text-purple-400 font-bold leading-none">{profile.full_name || "Super Admin"}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Plataforma SaaS</p>
            </div>

            <button
              onClick={() => void logout()}
              className="bg-red-950/40 border border-red-500/30 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-red-400 text-xs font-bold transition cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}

        {/* STORE_OWNER LOGUEADO */}
        {profile && profile.role === "store_owner" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/store-owner"
              className="bg-gradient-to-r from-cyan-400/20 to-blue-600/20 border border-cyan-500/30 px-5 py-2.5 rounded-xl text-cyan-300 font-bold hover:bg-cyan-500/20 transition text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(34,211,238,0.05)]"
            >
              🏪 Mi Almacén
            </Link>

            <Link
              href="/admin"
              className="text-gray-300 hover:text-cyan-400 transition text-sm font-semibold"
            >
              ⚙️ Inventario
            </Link>

            <div className="h-6 w-[1px] bg-white/10" />

            <div className="text-right">
              <p className="text-xs text-cyan-400 font-bold leading-none">{profile.full_name || "Almacenero"}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Dueño de Almacén</p>
            </div>

            <NotificationBell userId={profile.id} />

            <button
              onClick={() => void logout()}
              className="bg-red-950/40 border border-red-500/30 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-red-400 text-xs font-bold transition cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}

        {/* SELLER LOGUEADO */}
        {profile && profile.role === "seller" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/seller"
              className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-500/30 px-5 py-2.5 rounded-xl text-blue-300 font-bold hover:bg-blue-500/20 transition text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
            >
              💼 Consola Vendedor
            </Link>

            <Link
              href="/admin"
              className="text-gray-300 hover:text-blue-400 transition text-sm font-semibold"
            >
              ⚙️ Inventario
            </Link>

            <div className="h-6 w-[1px] bg-white/10" />

            <div className="text-right">
              <p className="text-xs text-blue-400 font-bold leading-none">{profile.full_name || "Vendedor"}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Vendedor de Almacén</p>
            </div>

            <NotificationBell userId={profile.id} />

            <button
              onClick={() => void logout()}
              className="bg-red-950/40 border border-red-500/30 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-red-400 text-xs font-bold transition cursor-pointer"
            >
              Salir
            </button>
          </div>
        )}

        {/* MOBILE BURGER BUTTON */}
        {profile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-cyan-400 focus:outline-none"
            aria-label="Abrir menú"
          >
            <span className="text-2xl">☰</span>
          </button>
        )}
      </div>

      {/* MOBILE MENU */}
      {profile && mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-b border-cyan-500/20 px-6 py-6 space-y-4">
          <div className="pb-4 border-b border-white/10">
            <p className="text-sm font-bold text-cyan-400">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>

          {profile.role === "client" && (
            <>
              <Link
                href="/stores"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 py-2 text-sm font-semibold"
              >
                🏪 Almacenes Locales
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 py-2 text-sm font-semibold"
              >
                🛒 Mi Carrito ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 py-2 text-sm font-semibold"
              >
                👤 Mi Cuenta
              </Link>
            </>
          )}

          {profile.role === "super_admin" && (
            <>
              <Link
                href="/super-admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-purple-400 py-2 text-sm font-semibold"
              >
                🛡️ Panel Super Admin
              </Link>
            </>
          )}

          {profile.role === "store_owner" && (
            <>
              <Link
                href="/store-owner"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 py-2 text-sm font-semibold"
              >
                🏪 Mi Almacén
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 py-2 text-sm font-semibold"
              >
                ⚙️ Inventario
              </Link>
            </>
          )}

          {profile.role === "seller" && (
            <>
              <Link
                href="/seller"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-blue-400 py-2 text-sm font-semibold"
              >
                💼 Consola Vendedor
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-blue-400 py-2 text-sm font-semibold"
              >
                ⚙️ Inventario
              </Link>
            </>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              void logout();
            }}
            className="w-full text-center bg-red-950/40 border border-red-500/30 text-red-400 py-3 rounded-xl text-sm font-bold cursor-pointer"
          >
            Salir de la cuenta
          </button>
        </div>
      )}
    </nav>
  );
}
