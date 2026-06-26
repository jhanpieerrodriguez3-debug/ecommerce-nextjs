"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { dbService } from "@/lib/dbService";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      showToast("Por favor, completa todos los campos obligatorios", "error");
      return;
    }
    if (password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    setLoading(true);

    try {
      // Registrar en Supabase Auth — siempre como CLIENT
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "client",
          },
        },
      });

      if (error) throw error;

      const user = data.user;
      if (!user) {
        showToast("Error al crear el usuario. Intenta de nuevo.", "error");
        setLoading(false);
        return;
      }

      if (user.identities && user.identities.length === 0) {
        showToast("Este correo electrónico ya está en uso. Por favor, inicia sesión.", "warning");
        setTimeout(() => router.push("/login"), 2000);
        setLoading(false);
        return;
      }

      // Crear perfil como CLIENT (sin store_id)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email ?? email, full_name: fullName, role: "client", store_id: null },
          { onConflict: "id" }
        );

      if (profileError) {
        console.warn("[Register] Error al crear perfil:", profileError.message);
      }

      const activeProfile = {
        id: user.id,
        email: user.email ?? email,
        role: "client" as const,
        full_name: fullName,
        store_id: undefined,
      };

      dbService.setCurrentProfile(activeProfile);
      showToast(`¡Bienvenido a DigitalMarket, ${fullName}! Tu cuenta está lista.`, "success");
      setTimeout(() => router.push("/stores"), 1200);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[Register] Error:", errorMsg);

      if (errorMsg.toLowerCase().includes("already registered") || errorMsg.toLowerCase().includes("already in use")) {
        showToast("Este correo ya está registrado. Por favor, inicia sesión.", "warning");
        setTimeout(() => router.push("/login"), 2000);
      } else if (errorMsg.includes("rate limit")) {
        showToast("Demasiadas solicitudes. Inténtalo más tarde.", "error");
      } else if (errorMsg.includes("Invalid email")) {
        showToast("El correo electrónico ingresado no es válido.", "error");
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050816] flex items-center justify-center py-16 px-5 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative z-10">

        {/* TITLE */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            🚀
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Crear Cuenta</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Únete a DigitalMarket y explora los mejores almacenes
          </p>
        </div>

        {/* INFO BOX */}
        <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 space-y-1.5">
          <p className="font-bold text-cyan-300">💡 ¿Cómo funciona?</p>
          <p>• Créate una cuenta como <strong>Cliente</strong> y empieza a explorar almacenes.</p>
          <p>• ¿Tienes un negocio? Puedes <strong>solicitar tu propio almacén</strong> desde tu panel de cuenta.</p>
          <p>• Tu solicitud será revisada y aprobada por el equipo de DigitalMarket.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* FULL NAME */}
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">
              Nombre Completo <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Juan Pérez González"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition duration-300"
              required
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">
              Correo Electrónico <span className="text-cyan-400">*</span>
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition duration-300"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-2">
              Contraseña <span className="text-cyan-400">*</span>
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition duration-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-xl font-bold text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                Creando cuenta...
              </>
            ) : (
              "Crear Mi Cuenta 🛒"
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-8 text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </main>
  );
}