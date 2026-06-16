"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { dbService, Profile, UserRole } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";

// Mapeo de rol a ruta de dashboard por defecto
const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/super-admin",
  store_owner: "/store-owner",
  seller: "/seller",
  client: "/stores"
};

// Roles que tienen permisos de backoffice (almacén)
const STORE_ROLES: UserRole[] = ["store_owner", "seller"];

export function useAuthGuard(requiredRole?: UserRole | UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const redirected = useRef(false);

  useEffect(() => {
    redirected.current = false;
    setLoading(true);

    const checkAuth = async () => {
      try {
        const activeProfile = await dbService.getCurrentProfile();

        if (!activeProfile) {
          if (!redirected.current) {
            redirected.current = true;
            showToast("Acceso denegado: Por favor inicia sesión", "error");
            router.push("/login");
          }
          setLoading(false);
          return;
        }

        // Verificar si el rol es válido para esta ruta
        if (requiredRole) {
          const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          const hasPermission = allowedRoles.includes(activeProfile.role);

          if (!hasPermission) {
            if (!redirected.current) {
              redirected.current = true;
              showToast(`Acceso denegado: Esta sección es exclusiva de ${getRoleLabel(allowedRoles[0])}`, "error");
              router.push(ROLE_HOME[activeProfile.role]);
            }
            setLoading(false);
            return;
          }
        }

        setProfile(activeProfile);
      } catch (err) {
        console.error("[useAuthGuard] Error de autenticación:", err);
        if (!redirected.current) {
          redirected.current = true;
          showToast("Error de sesión. Por favor inicia sesión de nuevo.", "error");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return { loading, profile };
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: "Super Administrador",
    store_owner: "Dueño de Almacén",
    seller: "Vendedor",
    client: "Cliente"
  };
  return labels[role] || role;
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    super_admin: "bg-purple-500/20 border-purple-500/30 text-purple-300",
    store_owner: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
    seller: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    client: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
  };
  return colors[role] || "bg-white/10 border-white/20 text-gray-300";
}

export function getRoleIcon(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    super_admin: "🛡️",
    store_owner: "🏪",
    seller: "💼",
    client: "🛒"
  };
  return icons[role] || "👤";
}

export { ROLE_HOME, STORE_ROLES };
