"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { dbService } from "@/lib/dbService";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Ingresa tu correo y contraseña comercial", "error");
      return;
    }

    setLoading(true);

    // ==========================================
    // ANCLAJE DE MOCK ACCOUNTS EXTREMADAMENTE ÚTILES PARA LA DEFENSA
    // ==========================================
    if (password === "123456") {
      if (email === "admin@test.com") {
        const mockAdminProfile = {
          id: "mock-admin-id",
          email: "admin@test.com",
          role: "admin" as const,
          full_name: "Gonzalo Valenzuela (Don Tito)",
          store_id: 1
        };
        dbService.setCurrentProfile(mockAdminProfile);
        showToast("¡Acceso concedido! Bienvenido al Panel de Administración", "success");
        setTimeout(() => router.push("/admin"), 1200);
        setLoading(false);
        return;
      }
      
      if (email === "client@test.com") {
        const mockClientProfile = {
          id: "mock-client-id",
          email: "client@test.com",
          role: "client" as const,
          full_name: "Vecino Frecuente",
          store_id: undefined
        };
        dbService.setCurrentProfile(mockClientProfile);
        showToast("¡Acceso concedido! Cargando catálogo de almacenes", "success");
        setTimeout(() => router.push("/stores"), 1200);
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Intentar iniciar sesión con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (user) {
        // 2. Intentar buscar el perfil en Supabase
        let profileRole: "admin" | "client" = "client";
        let fullName = "Usuario DigitalMarket";
        let storeId = undefined;

        try {
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!profileErr && profileData) {
            profileRole = profileData.role || "client";
            fullName = profileData.full_name || fullName;
            storeId = profileData.store_id || undefined;
          }
        } catch {
          // No existe la tabla, usar mapeos
        }

        // Buscar si se registró localmente en localStorage
        const localProfiles = JSON.parse(localStorage.getItem("digitalmarket_profiles") || "[]");
        const match = localProfiles.find((p: any) => p.email === email);
        if (match) {
          profileRole = match.role;
          fullName = match.full_name;
          storeId = match.store_id;
        }

        const activeProfile = {
          id: user.id,
          email: user.email || email,
          role: profileRole,
          full_name: fullName,
          store_id: storeId
        };

        dbService.setCurrentProfile(activeProfile);

        showToast(`¡Sesión iniciada! Hola, ${fullName}`, "success");

        setTimeout(() => {
          if (profileRole === "admin") {
            router.push("/admin");
          } else {
            router.push("/stores");
          }
        }, 1200);
      }
    } catch (err: any) {
      // Fallback local-first si Supabase falla o no está conectado y coincide con registros locales
      console.warn("Falla de login en Supabase. Intentando match local.");
      
      const localProfiles = JSON.parse(localStorage.getItem("digitalmarket_profiles") || "[]");
      const match = localProfiles.find((p: any) => p.email === email);
      
      if (match) {
        dbService.setCurrentProfile(match);
        showToast(`¡Sesión de demostración iniciada! Hola, ${match.full_name}`, "success");
        setTimeout(() => {
          if (match.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/stores");
          }
        }, 1200);
      } else {
        showToast(err.message || "Credenciales inválidas en el sistema", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050816] flex items-center justify-center px-5 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      {/* CARD */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative z-10 animate-fade-in-slide-up">
        
        {/* TITLE */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            🛍️
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Bienvenido
          </h1>
          <p className="text-gray-400 text-sm">
            Inicia sesión en la consola de DIGITALMARKET
          </p>
        </div>

        {/* MOCK ACCOUNTS TIP BOX */}
        <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
          <p className="font-bold">💡 Cuentas Rápidas de Demostración (Clave: 123456)</p>
          <p>• Dueño de Almacén: <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">admin@test.com</code></p>
          <p>• Cliente Vecino: <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">client@test.com</code></p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* EMAIL */}
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="admin@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-xl font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Validando Acceso...
              </>
            ) : (
              "Ingresar a Consola"
            )}
          </button>
        </form>

        {/* REGISTER LINK */}
        <p className="text-center text-gray-400 mt-8">
          ¿No tienes una cuenta comercial?{" "}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Crear Cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}
