"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { dbService, Profile } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";

export function useAuthGuard(requiredRole?: "admin" | "client") {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Evitar múltiples redireccionamientos con ref
  const redirected = useRef(false);

  useEffect(() => {
    // Resetear en cada cambio de ruta
    redirected.current = false;
    setLoading(true);

    const checkAuth = async () => {
      const activeProfile = await dbService.getCurrentProfile();

      if (!activeProfile) {
        if (!redirected.current) {
          redirected.current = true;
          showToast("Acceso denegado: Por favor inicia sesión", "error");
          router.push("/login");
        }
        return;
      }

      if (requiredRole && activeProfile.role !== requiredRole) {
        if (!redirected.current) {
          redirected.current = true;
          showToast(
            `Acceso denegado: Se requiere rol de ${requiredRole === "admin" ? "Administrador" : "Cliente"}`,
            "error"
          );
          router.push(activeProfile.role === "admin" ? "/admin" : "/stores");
        }
        return;
      }

      setProfile(activeProfile);
      setLoading(false);
    };

    void checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return { loading, profile };
}
