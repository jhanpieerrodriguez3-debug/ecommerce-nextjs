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
  const [role, setRole] = useState<"client" | "admin">("client");
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
      // 1. Registro en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (user) {
        // 2. Intentar actualizar el perfil en Supabase (si existe la tabla)
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email,
              role: role,
              full_name: fullName,
              store_id: role === "admin" ? 1 : null // por defecto vincular a la tienda 1 para la demo
            });
            
          if (profileError) console.warn("Error Supabase profile:", profileError);
        } catch (dbErr) {
          console.warn("Tabla profiles no lista en Supabase. Usando local-first.");
        }

        // 3. Registrar en nuestra capa de datos local-first
        const mockProfile = {
          id: user.id,
          email: user.email || email,
          role: role,
          full_name: fullName,
          store_id: role === "admin" ? 1 : undefined
        };
        
        // Registrar en localStorage para persistencia híbrida
        const localProfiles = JSON.parse(localStorage.getItem("digitalmarket_profiles") || "[]");
        localProfiles.push(mockProfile);
        localStorage.setItem("digitalmarket_profiles", JSON.stringify(localProfiles));
        
        // Guardar sesión activa local
        dbService.setCurrentProfile(mockProfile);

        showToast("¡Cuenta creada con éxito! Bienvenido a DigitalMarket", "success");
        
        // Redirección inmediata según rol
        setTimeout(() => {
          if (role === "admin") {
            router.push("/admin");
          } else {
            router.push("/stores");
          }
        }, 1500);
      }
    } catch (err: any) {
      // Fallback local-first si Supabase falla o está sin conexión
      console.warn("Falla de registro en Supabase. Usando fallback 100% simulado.");
      
      const simulatedUserId = "sim-" + Math.random().toString(36).substring(4);
      const mockProfile = {
        id: simulatedUserId,
        email: email,
        role: role,
        full_name: fullName,
        store_id: role === "admin" ? 1 : undefined
      };
      
      // Registrar localmente
      const localProfiles = JSON.parse(localStorage.getItem("digitalmarket_profiles") || "[]");
      localProfiles.push(mockProfile);
      localStorage.setItem("digitalmarket_profiles", JSON.stringify(localProfiles));
      
      // Guardar sesión activa local
      dbService.setCurrentProfile(mockProfile);

      showToast("¡Registro exitoso! (Modo de demostración interactiva activo)", "success");
      
      setTimeout(() => {
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/stores");
        }
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050816] flex items-center justify-center py-16 px-5 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      {/* CARD */}
      <div className="w-full max-w-xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative z-10">
        
        {/* TITLE */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            🚀
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Crear Cuenta
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Regístrate en DIGITALMARKET y digitaliza tu experiencia comercial
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
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
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition duration-300"
              required
            />
          </div>

          {/* ROLE SELECTOR (GLASS CARDS) */}
          <div>
            <label className="text-gray-300 text-sm font-semibold block mb-3">
              Selecciona tu Rol Comercial <span className="text-cyan-400">*</span>
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CLIENT CARD */}
              <div
                onClick={() => setRole("client")}
                className={`cursor-pointer p-5 rounded-2xl border transition duration-300 flex flex-col items-center text-center gap-2 backdrop-blur-lg ${
                  role === "client"
                    ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] text-white"
                    : "bg-black/20 border-white/10 hover:border-cyan-400/50 text-gray-400"
                }`}
              >
                <span className="text-3xl">🛒</span>
                <h3 className="font-bold text-lg text-white">Cliente / Comprador</h3>
                <p className="text-xs opacity-75">Quiero comprar alimentos y abarrotes en mis almacenes de barrio favoritos.</p>
              </div>

              {/* ADMIN CARD */}
              <div
                onClick={() => setRole("admin")}
                className={`cursor-pointer p-5 rounded-2xl border transition duration-300 flex flex-col items-center text-center gap-2 backdrop-blur-lg ${
                  role === "admin"
                    ? "bg-blue-500/10 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-white"
                    : "bg-black/20 border-white/10 hover:border-blue-400/50 text-gray-400"
                }`}
              >
                <span className="text-3xl">🏪</span>
                <h3 className="font-bold text-lg text-white">Dueño de Almacén</h3>
                <p className="text-xs opacity-75">Quiero digitalizar mi negocio, gestionar stock, registrar ventas y controlar caja.</p>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-xl font-bold text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                Creando Cuenta comercial...
              </>
            ) : (
              "Crear Mi Cuenta"
            )}
          </button>
        </form>

        {/* LOGIN LINK */}
        <p className="text-center text-gray-400 mt-8">
          ¿Ya tienes una cuenta comercial?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </main>
  );
}