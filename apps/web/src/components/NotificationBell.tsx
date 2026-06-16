"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { dbService, AppNotification } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";

export default function NotificationBell({ userId }: { userId: string }) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState<string | null>(null); // invitation_id
  const [inviteForm, setInviteForm] = useState({
    rut: "", full_name: "", birthdate: "", phone: "", address: "", experience: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const load = useCallback(async () => {
    const data = await dbService.getNotifications();
    setNotifications(data);
  }, []);

  useEffect(() => {
    if (!userId) return;
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => clearInterval(interval);
  }, [userId, load]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleNotificationClick = async (notif: AppNotification) => {
    // 1. Marcar como leída inmediatamente si no lo está
    if (!notif.is_read) {
      await markRead(notif.id);
    }

    // 2. Acción según tipo de notificación
    if (notif.type === "seller_invite" && notif.data?.invitation_id) {
      setInviteForm({ rut: "", full_name: "", birthdate: "", phone: "", address: "", experience: "" });
      setShowInviteForm(notif.data.invitation_id as string);
      setOpen(false);
    } else if (notif.type === "low_stock") {
      window.location.href = "/admin";
    } else if (notif.type === "order_status" || notif.type === "new_order") {
      const path = window.location.pathname;
      if (path.includes("store-owner")) {
        window.location.href = "/store-owner";
      } else if (path.includes("seller")) {
        window.location.href = "/seller";
      } else {
        window.location.href = "/dashboard";
      }
    } else if (notif.type === "invite_accepted" || notif.type === "invite_rejected") {
      window.location.href = "/store-owner";
    } else {
      setSelectedNotif(notif);
      setOpen(false);
    }
  };

  const markRead = async (id: string) => {
    await dbService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleAcceptInvite = async (notif: AppNotification) => {
    await markRead(notif.id);
    setInviteForm({ rut: "", full_name: "", birthdate: "", phone: "", address: "", experience: "" });
    setShowInviteForm(notif.data?.invitation_id as string);
    setOpen(false);
  };

  const handleRejectInvite = async (notif: AppNotification) => {
    if (!notif.data?.invitation_id) return;
    setSubmitting(true);
    try {
      const result = await dbService.respondSellerInvite(notif.data.invitation_id as string, false);
      if (result.success) {
        showToast("Invitación rechazada", "info");
        await markRead(notif.id);
        void load();
      } else {
        showToast(result.message || "Error al rechazar", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSellerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInviteForm) return;

    console.log("[NotificationBell] Iniciando envío de perfil de vendedor:", inviteForm);

    if (!inviteForm.rut.trim() || !inviteForm.full_name.trim() || !inviteForm.birthdate) {
      showToast("Por favor completa los campos requeridos", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = await dbService.respondSellerInvite(showInviteForm, true, inviteForm);
      console.log("[NotificationBell] Resultado respondSellerInvite:", result);

      if (result && result.success) {
        showToast("✅ ¡Bienvenido al equipo! Tu perfil de vendedor ha sido creado.", "success");
        setShowInviteForm(null);
        void load();
        // Recargar para actualizar el rol
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorMsg = result?.message || "Error al aceptar la invitación";
        showToast(errorMsg, "error");
        console.error("[NotificationBell] Error en el servidor al aceptar invitación:", errorMsg);
      }
    } catch (err: any) {
      console.error("[NotificationBell] Excepción al enviar formulario:", err);
      showToast(err?.message || "Error inesperado al enviar formulario", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const typeIcon: Record<string, string> = {
    seller_invite: "🏪",
    invite_accepted: "✅",
    invite_rejected: "❌",
    order_status: "📦",
    low_stock: "⚠️",
  };

  return (
    <>
      {/* Campana */}
      <div className="relative" ref={panelRef}>
        <button
          id="notification-bell-btn"
          onClick={() => setOpen(!open)}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition cursor-pointer"
          aria-label="Notificaciones"
        >
          🔔
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Panel desplegable */}
        {open && (
          <div className="absolute right-0 top-12 w-[340px] bg-[#0d1117] border border-white/10 rounded-[20px] shadow-2xl z-50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
              <h4 className="font-black text-white text-sm">🔔 Notificaciones</h4>
              {unread > 0 && (
                <button
                  onClick={async () => {
                    await Promise.all(notifications.filter(n => !n.is_read).map(n => dbService.markNotificationRead(n.id)));
                    void load();
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🔕</p>
                  <p className="text-gray-500 text-xs">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => void handleNotificationClick(notif)}
                    className={`px-4 py-3 border-b border-white/5 transition ${!notif.is_read ? "bg-cyan-500/5" : "opacity-60"
                      } hover:bg-white/5 cursor-pointer`}
                  >
                    <div className="flex gap-3 items-start">
                      <span className="text-xl mt-0.5">{typeIcon[notif.type] ?? "📩"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold">{notif.title}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-gray-600 text-[10px] mt-1">
                          {new Date(notif.created_at).toLocaleString("es-CL")}
                        </p>

                        {/* Botones de acción para invitaciones */}
                        {notif.type === "seller_invite" && notif.data?.invitation_id && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); void handleAcceptInvite(notif); }}
                              disabled={submitting}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-1.5 rounded-lg transition cursor-pointer disabled:opacity-40"
                            >
                              ✅ Aceptar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); void handleRejectInvite(notif); }}
                              disabled={submitting}
                              className="flex-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black py-1.5 rounded-lg transition cursor-pointer disabled:opacity-40"
                            >
                              ❌ Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulario de Vendedor */}
      {showInviteForm && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <div>
                <h3 className="font-black text-white text-lg">🏪 Completa tu Perfil de Vendedor</h3>
                <p className="text-gray-400 text-xs mt-1">Estos datos serán visibles para el dueño del almacén</p>
              </div>
              <button onClick={() => setShowInviteForm(null)} className="text-gray-400 hover:text-white text-2xl cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmitSellerForm} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-[11px] font-bold block mb-1">RUT *</label>
                  <input
                    type="text"
                    placeholder="12.345.678-9"
                    value={inviteForm.rut}
                    onChange={e => setInviteForm(f => ({ ...f, rut: e.target.value }))}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-[11px] font-bold block mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={inviteForm.birthdate}
                    onChange={e => setInviteForm(f => ({ ...f, birthdate: e.target.value }))}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-[11px] font-bold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Juan Pérez González"
                  value={inviteForm.full_name}
                  onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] font-bold block mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={inviteForm.phone}
                  onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] font-bold block mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="Av. Principal 123, Santiago"
                  value={inviteForm.address}
                  onChange={e => setInviteForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] font-bold block mb-1">Experiencia en Ventas</label>
                <textarea
                  placeholder="Cuéntanos tu experiencia previa en ventas o atención al cliente..."
                  value={inviteForm.experience}
                  onChange={e => setInviteForm(f => ({ ...f, experience: e.target.value }))}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(null)}
                  className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-3 rounded-xl text-sm hover:border-white/20 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black py-3 rounded-xl text-sm transition hover:opacity-90 cursor-pointer disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : "✅ Confirmar y Unirme"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Modal Genérico de Notificación (Lectura) */}
      {selectedNotif && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-3xl">{typeIcon[selectedNotif.type] ?? "📩"}</span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none transition cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-white text-lg leading-snug">{selectedNotif.title}</h3>
              <p className="text-gray-400 text-xs font-semibold">
                {new Date(selectedNotif.created_at).toLocaleString("es-CL")}
              </p>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedNotif.body}</p>

            <button
              onClick={() => setSelectedNotif(null)}
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl text-sm hover:border-white/20 transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
