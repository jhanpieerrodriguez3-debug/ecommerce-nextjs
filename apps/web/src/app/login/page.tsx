"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { dbService, UserRole } from "@/lib/dbService";
import { ROLE_HOME } from "@/hooks/useAuthGuard";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Ingresa tu correo y contraseña", "error");
      return;
    }

    setLoading(true);

    try {
      // PASO 1: Intentar autenticar por BFF/users-service
      const bffUrl = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:4000";
      const bffRes = await fetch(`${bffUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (bffRes.ok) {
        const bffData = await bffRes.json();
        if (bffData.success && bffData.profile) {
          if (bffData.token) localStorage.setItem("digitalmarket_token", bffData.token);
          const activeProfile = {
            id: bffData.profile.id,
            email: bffData.profile.email,
            role: bffData.profile.role as UserRole,
            full_name: bffData.profile.full_name,
            store_id: bffData.profile.store_id ?? undefined,
          };
          dbService.setCurrentProfile(activeProfile);
          showToast(`¡Bienvenido, ${activeProfile.full_name}!`, "success");
          setTimeout(() => router.push(ROLE_HOME[activeProfile.role]), 1000);
          setLoading(false);
          return;
        }
      }
    } catch (bffErr: any) {
      console.warn("[Login] BFF no disponible:", bffErr.message);
    }

    try {
      // PASO 2: Autenticar con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("No se pudo obtener el usuario de Supabase.");

      // PASO 3: Leer perfil
      let profileRole: UserRole = "client";
      let fullName = "Usuario DigitalMarket";
      let storeId: number | undefined = undefined;

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, store_id")
        .eq("id", user.id)
        .single();

      if (!profileErr && profileData) {
        profileRole = (profileData.role as UserRole) || "client";
        fullName = profileData.full_name || fullName;
        storeId = profileData.store_id ?? undefined;
      } else {
        // Crear perfil desde metadata si no existe
        const meta = user.user_metadata || {};
        profileRole = (meta.role as UserRole) || "client";
        fullName = (meta.full_name as string) || "Usuario DigitalMarket";

        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email ?? email,
          full_name: fullName,
          role: profileRole,
          store_id: storeId ?? null,
        }, { onConflict: "id" });
      }

      // Si es seller, resolver store desde store_members
      if (profileRole === "seller" && !storeId) {
        const { data: memberData } = await supabase
          .from("store_members")
          .select("store_id")
          .eq("user_id", user.id)
          .single();
        storeId = memberData?.store_id;
      }

      const activeProfile = {
        id: user.id,
        email: user.email ?? email,
        role: profileRole,
        full_name: fullName,
        store_id: storeId,
      };

      dbService.setCurrentProfile(activeProfile);
      showToast(`¡Bienvenido de vuelta, ${fullName}!`, "success");
      setTimeout(() => router.push(ROLE_HOME[profileRole]), 1000);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[Login] Fallo:", errorMsg);

      if (errorMsg.toLowerCase().includes("invalid login credentials")) {
        showToast("El correo o la contraseña son incorrectos.", "error");
      } else if (errorMsg.toLowerCase().includes("email not confirmed")) {
        showToast("Debes confirmar tu correo antes de iniciar sesión.", "warning");
      } else {
        showToast(errorMsg, "error");
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
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative z-10">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            🛍️
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Bienvenido</h1>
          <p className="text-gray-400 text-sm">Inicia sesión en DigitalMarket</p>
        </div>



        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">Correo Electrónico</label>
            <input
              id="login-email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">Contraseña</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-xl font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Verificando acceso...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-8 text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Registrarse gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
