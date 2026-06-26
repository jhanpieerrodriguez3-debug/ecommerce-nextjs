"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Store, StoreRequest, Profile, GlobalStats } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";

export default function SuperAdminPage() {
  const { showToast } = useToast();
  const { loading: authLoading, profile } = useAuthGuard("super_admin");

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"requests" | "stores" | "users">("requests");
  const [localLoading, setLocalLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados para eliminación de usuario con sobre-confirmación
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; user: Profile | null }>({ open: false, user: null });
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [statsData, reqData, storeData, usersData] = await Promise.all([
        dbService.getGlobalStats(),
        dbService.getAllStoreRequests(),
        dbService.getAllStores(),
        dbService.getAllUsers()
      ]);
      setStats(statsData);
      setRequests(reqData);
      setStores(storeData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error cargando datos super-admin:", err);
    } finally {
      setLocalLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading || !profile) return;
    void loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadData();
      }
    }, 10000); // Recarga automática cada 10 segundos si la pestaña está activa
    return () => clearInterval(interval);
  }, [authLoading, loadData, profile]);

  const handleApprove = async (requestId: string) => {
    if (!profile) return;
    setActionLoading(requestId);
    try {
      await dbService.approveStoreRequest(requestId, profile.id);
      showToast("✅ Solicitud aprobada. El almacén está ahora activo.", "success");
      void loadData();
    } catch {
      showToast("Error al aprobar la solicitud", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!profile || !rejectModal.requestId) return;
    setActionLoading(rejectModal.requestId);
    try {
      await dbService.rejectStoreRequest(rejectModal.requestId, profile.id, rejectNote || "Solicitud rechazada por el administrador.");
      showToast("❌ Solicitud rechazada.", "warning");
      setRejectModal({ open: false, requestId: "" });
      setRejectNote("");
      void loadData();
    } catch {
      showToast("Error al rechazar la solicitud", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStoreStatus = async (storeId: number, status: "approved" | "suspended" | "pending") => {
    await dbService.updateStoreStatus(storeId, status);
    const labels = { approved: "activado", suspended: "suspendido", pending: "marcado como pendiente" };
    showToast(`Almacén ${labels[status]} correctamente`, "success");
    void loadData();
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal.user) return;
    if (deleteConfirmEmail !== deleteUserModal.user.email) {
      showToast("El correo ingresado no coincide con el del usuario a eliminar", "error");
      return;
    }
    setActionLoading(deleteUserModal.user.id);
    try {
      await dbService.deleteUser(deleteUserModal.user.id);
      showToast("👤 Usuario eliminado correctamente del sistema", "success");
      setDeleteUserModal({ open: false, user: null });
      setDeleteConfirmEmail("");
      void loadData();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar usuario", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");

  if (authLoading || localLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando panel de administración...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      {/* GLOWS */}
      <div className="absolute w-[600px] h-[600px] bg-purple-500/5 blur-[130px] rounded-full top-[-100px] left-[-150px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full bottom-0 right-0" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                🛡️
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Panel DigitalMarket</h1>
            </div>
            <p className="text-gray-400 text-sm">
              Bienvenido, <strong className="text-purple-300">{profile?.full_name}</strong> · Super Administrador
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingRequests.length > 0 && (
              <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black px-4 py-2 rounded-full animate-pulse">
                🔔 {pendingRequests.length} solicitud{pendingRequests.length > 1 ? "es" : ""} pendiente{pendingRequests.length > 1 ? "s" : ""}
              </span>
            )}
            <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black px-4 py-2 rounded-full uppercase">
              ● Sistema Activo
            </span>
          </div>
        </div>

        {/* KPIs GLOBALES */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Almacenes", value: stats.totalStores, color: "text-white", icon: "🏪" },
              { label: "Pendientes Aprobación", value: stats.pendingStores, color: "text-yellow-300", icon: "⏳" },
              { label: "Aprobados & Activos", value: stats.approvedStores, color: "text-emerald-400", icon: "✅" },
              { label: "Suspendidos", value: stats.suspendedStores, color: "text-red-400", icon: "⛔" },
              { label: "Usuarios Totales", value: stats.totalUsers, color: "text-cyan-400", icon: "👥" },
              { label: "Solicitudes Pendientes", value: stats.pendingRequests, color: "text-purple-300", icon: "📋" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[22px] p-5 hover:border-purple-400/30 transition">
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wide">{kpi.icon} {kpi.label}</p>
                <h3 className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</h3>
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit">
          {[
            { key: "requests", label: "📋 Solicitudes", badge: pendingRequests.length },
            { key: "stores", label: "🏪 Almacenes" },
            { key: "users", label: "👥 Usuarios" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="bg-yellow-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: SOLICITUDES */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Solicitudes de Almacén</h2>
              <span className="text-gray-400 text-sm">{requests.length} total</span>
            </div>

            {requests.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-16 text-center">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-gray-400">No hay solicitudes de almacén registradas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className={`bg-white/5 border rounded-[25px] p-6 transition ${
                    req.status === "pending" ? "border-yellow-500/30 hover:border-yellow-500/50" :
                    req.status === "approved" ? "border-emerald-500/30" : "border-red-500/30 opacity-70"
                  }`}>
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-black text-white">{req.store_name}</h3>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                            req.status === "pending" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" :
                            req.status === "approved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" :
                            "bg-red-500/10 border-red-500/30 text-red-300"
                          }`}>
                            {req.status === "pending" ? "⏳ Pendiente" : req.status === "approved" ? "✅ Aprobado" : "❌ Rechazado"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400">
                          <p>👤 <span className="text-white font-semibold">{req.user_name || "—"}</span></p>
                          <p>📧 <span className="text-cyan-300">{req.user_email || "—"}</span></p>
                          <p>📍 <span className="text-white">{req.city || "—"}</span></p>
                          <p>📞 <span className="text-white">{req.phone || "—"}</span></p>
                        </div>
                        {req.description && (
                          <p className="text-gray-400 text-xs mt-2 line-clamp-2">{req.description}</p>
                        )}
                        {req.review_note && (
                          <p className="text-red-300 text-xs italic">Nota: {req.review_note}</p>
                        )}
                        <p className="text-gray-600 text-[10px]">
                          Enviado: {new Date(req.created_at).toLocaleDateString("es-CL")}
                        </p>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading === req.id}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === req.id ? (
                              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : "✅ Aprobar"}
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, requestId: req.id })}
                            disabled={actionLoading === req.id}
                            className="w-full bg-red-950/60 border border-red-500/30 hover:bg-red-600 text-red-400 hover:text-white font-black py-2.5 px-4 rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ALMACENES */}
        {activeTab === "stores" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Todos los Almacenes</h2>
              <span className="text-gray-400 text-sm">{stores.length} total</span>
            </div>

            {stores.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-16 text-center">
                <p className="text-4xl mb-4">🏪</p>
                <p className="text-gray-400">No hay almacenes registrados.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map((store) => (
                  <div key={store.id} className={`bg-white/5 border rounded-[22px] overflow-hidden transition ${
                    store.status === "approved" ? "border-emerald-500/20" :
                    store.status === "pending" ? "border-yellow-500/20" :
                    "border-red-500/20 opacity-80"
                  }`}>
                    <div className="h-32 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={store.image} alt={store.name} className="w-full h-full object-cover opacity-60" />
                      <span className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                        store.status === "approved" ? "bg-emerald-500/80 border-emerald-400 text-white" :
                        store.status === "pending" ? "bg-yellow-500/80 border-yellow-400 text-black" :
                        "bg-red-500/80 border-red-400 text-white"
                      }`}>
                        {store.status === "approved" ? "✅ Activo" : store.status === "pending" ? "⏳ Pendiente" : "⛔ Suspendido"}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-black text-white">{store.name}</h3>
                      <p className="text-gray-400 text-xs">📍 {store.address}</p>
                      <div className="flex gap-2 flex-wrap">
                        {store.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateStoreStatus(store.id, "approved")}
                            className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-500/40 transition cursor-pointer"
                          >
                            ✅ Activar
                          </button>
                        )}
                        {store.status !== "suspended" && (
                          <button
                            onClick={() => handleUpdateStoreStatus(store.id, "suspended")}
                            className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500/40 transition cursor-pointer"
                          >
                            ⛔ Suspender
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: USUARIOS */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Usuarios del Sistema</h2>
              <span className="text-gray-400 text-sm">{users.length} registrados</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[25px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                      <th className="text-left p-4 font-bold">Usuario</th>
                      <th className="text-left p-4 font-bold">Correo</th>
                      <th className="text-left p-4 font-bold">Rol</th>
                      <th className="text-left p-4 font-bold">Store ID</th>
                      <th className="text-right p-4 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 font-semibold text-white">{user.full_name || "—"}</td>
                        <td className="p-4 text-gray-400">{user.email}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${
                            user.role === "super_admin" ? "bg-purple-500/20 border-purple-500/30 text-purple-300" :
                            user.role === "store_owner" ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" :
                            user.role === "seller" ? "bg-blue-500/20 border-blue-500/30 text-blue-300" :
                            "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                          }`}>
                            {user.role === "super_admin" ? "🛡️ Super Admin" :
                             user.role === "store_owner" ? "🏪 Store Owner" :
                             user.role === "seller" ? "💼 Seller" : "🛒 Client"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-xs">{user.store_id || "—"}</td>
                        <td className="p-4 text-right">
                          {user.id !== profile?.id ? (
                            <button
                              onClick={() => setDeleteUserModal({ open: true, user })}
                              className="text-xs bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                            >
                              🗑️ Eliminar
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-semibold italic">Tú (Activo)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE RECHAZO */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f1e] border border-red-500/30 rounded-[30px] p-8 max-w-md w-full space-y-5 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
            <h3 className="text-xl font-black text-white">❌ Rechazar Solicitud</h3>
            <p className="text-gray-400 text-sm">Ingresa el motivo del rechazo (opcional pero recomendado):</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Ej: La información proporcionada es insuficiente..."
              className="w-full bg-black/40 border border-red-500/20 rounded-xl p-4 text-white text-sm outline-none focus:border-red-400 h-28 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.requestId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading === rejectModal.requestId ? "Procesando..." : "Confirmar Rechazo"}
              </button>
              <button
                onClick={() => { setRejectModal({ open: false, requestId: "" }); setRejectNote(""); }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN DE USUARIO CON SOBRE-CONFIRMACIÓN */}
      {deleteUserModal.open && deleteUserModal.user && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0f1e] border border-rose-500/30 rounded-[30px] p-8 max-w-md w-full space-y-5 shadow-[0_0_40px_rgba(244,63,94,0.15)] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center text-3xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white">¿Eliminar Usuario de forma permanente?</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Esta acción borrará definitivamente la cuenta de <strong>{deleteUserModal.user.full_name || "este usuario"}</strong> ({deleteUserModal.user.email}) y todos sus datos relacionados del sistema.
              </p>
            </div>
            <div className="space-y-2 bg-black/40 border border-white/5 p-4 rounded-2xl">
              <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider">Para continuar, escribe su correo electrónico:</label>
              <p className="text-xs text-gray-500 font-mono select-all select-text">{deleteUserModal.user.email}</p>
              <input
                type="text"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder="Ej: usuario@correo.com"
                className="w-full bg-black/60 border border-white/10 focus:border-rose-500/50 rounded-xl p-3 text-white text-xs outline-none transition"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading === deleteUserModal.user.id || deleteConfirmEmail !== deleteUserModal.user.email}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {actionLoading === deleteUserModal.user.id ? "Eliminando..." : "Confirmar Borrado 🗑️"}
              </button>
              <button
                onClick={() => { setDeleteUserModal({ open: false, user: null }); setDeleteConfirmEmail(""); }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
