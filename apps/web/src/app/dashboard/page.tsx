"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Order, StoreRequest } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";
import { GridSkeleton } from "@/components/Skeleton";

export default function DashboardPage() {
  const { showToast } = useToast();
  const { loading: authLoading, profile } = useAuthGuard("client");

  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [clientAddresses, setClientAddresses] = useState<any[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // Address form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Store request form
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [reqStoreName, setReqStoreName] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqAddress, setReqAddress] = useState("");
  const [reqCity, setReqCity] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [storeReqLoading, setStoreReqLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [orderData, addrData, reqData] = await Promise.all([
        dbService.getClientOrders(profile.id),
        dbService.getAddresses(profile.id),
        dbService.getStoreRequestsByUser(profile.id)
      ]);
      setClientOrders(orderData);
      setClientAddresses(addrData);
      setStoreRequests(reqData);
    } catch (err) {
      console.error("Error cargando datos del cliente:", err);
    } finally {
      setLocalLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading || !profile) return;
    void loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [authLoading, loadData, profile]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !fullName || !phone || !city || !address) {
      showToast("Completa todos los campos de dirección", "error");
      return;
    }
    await dbService.saveAddress({ user_id: profile.id, full_name: fullName, phone, city, address });
    setFullName(""); setPhone(""); setCity(""); setAddress("");
    showToast("Dirección guardada exitosamente", "success");
    void loadData();
  };

  const handleSubmitStoreRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reqStoreName || !reqCity) {
      showToast("Completa los campos obligatorios", "error");
      return;
    }

    // Verificar si ya tiene una solicitud pendiente o aprobada
    const hasPendingOrApproved = storeRequests.some(r => r.status === "pending" || r.status === "approved");
    if (hasPendingOrApproved) {
      showToast("Ya tienes una solicitud activa o aprobada", "warning");
      return;
    }

    setStoreReqLoading(true);
    try {
      await dbService.createStoreRequest({
        user_id: profile.id,
        store_name: reqStoreName,
        description: reqDescription,
        address: reqAddress,
        city: reqCity,
        phone: reqPhone
      });
      showToast("¡Solicitud enviada! El equipo de DigitalMarket la revisará pronto.", "success");
      setReqStoreName(""); setReqDescription(""); setReqAddress(""); setReqCity(""); setReqPhone("");
      setShowStoreForm(false);
      void loadData();
    } catch {
      showToast("Error al enviar la solicitud. Intenta de nuevo.", "error");
    } finally {
      setStoreReqLoading(false);
    }
  };

  if (authLoading || localLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando tu panel...</p>
      </main>
    );
  }

  const pendingRequest = storeRequests.find(r => r.status === "pending");
  const approvedRequest = storeRequests.find(r => r.status === "approved");

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-600/5 blur-[120px] rounded-full bottom-0 right-0" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white">👤 Mi Cuenta</h1>
            <p className="text-gray-400 mt-1">
              Hola, <strong className="text-emerald-300">{profile?.full_name}</strong> · Cliente DigitalMarket
            </p>
          </div>
          <Link href="/stores"
            className="bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 py-3 rounded-2xl text-white font-bold text-sm hover:scale-[1.03] transition shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center gap-2">
            🏪 Explorar Almacenes
          </Link>
        </div>

        {/* BANNER: SOLICITUD DE ALMACÉN */}
        {!pendingRequest && !approvedRequest && (
          <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/20 rounded-[30px] p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl">🏪</div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white">¿Tienes un negocio? ¡Digitalízalo con DigitalMarket!</h3>
              <p className="text-gray-400 text-sm mt-1">
                Solicita tu propio almacén en la plataforma. Nuestro equipo revisará tu solicitud y te contactará.
              </p>
            </div>
            <button
              onClick={() => setShowStoreForm(!showStoreForm)}
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-2xl text-white font-bold text-sm hover:scale-[1.03] transition whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              {showStoreForm ? "Cancelar" : "Solicitar mi Almacén →"}
            </button>
          </div>
        )}

        {/* ESTADO DE SOLICITUD PENDIENTE */}
        {pendingRequest && (
          <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-[25px] p-6 flex items-center gap-4">
            <span className="text-4xl">⏳</span>
            <div>
              <h3 className="font-black text-yellow-300">Tu solicitud está en revisión</h3>
              <p className="text-gray-400 text-sm">
                <strong className="text-white">{pendingRequest.store_name}</strong> — Enviada el{" "}
                {new Date(pendingRequest.created_at).toLocaleDateString("es-CL")}. El equipo de DigitalMarket la revisará pronto.
              </p>
            </div>
          </div>
        )}

        {/* ESTADO DE SOLICITUD APROBADA */}
        {approvedRequest && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-[25px] p-6 flex items-center gap-4">
            <span className="text-4xl">🎉</span>
            <div>
              <h3 className="font-black text-emerald-300">¡Tu almacén fue aprobado!</h3>
              <p className="text-gray-400 text-sm">
                <strong className="text-white">{approvedRequest.store_name}</strong> ya está activo en la plataforma.
                Cierra sesión e inicia de nuevo para acceder a tu panel de dueño.
              </p>
            </div>
          </div>
        )}

        {/* FORMULARIO DE SOLICITUD DE ALMACÉN */}
        {showStoreForm && !pendingRequest && !approvedRequest && (
          <div className="bg-white/5 border border-cyan-500/20 rounded-[30px] p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white">📋 Solicitud de Almacén</h2>
              <p className="text-gray-400 text-sm mt-1">
                Completa la información de tu negocio. Una vez aprobado, obtendrás acceso al panel de dueño.
              </p>
            </div>

            <form onSubmit={handleSubmitStoreRequest} className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-gray-300 text-sm font-semibold block mb-2">Nombre del Almacén *</label>
                <input type="text" placeholder="Ej: Almacén Don Carlos" value={reqStoreName} onChange={e => setReqStoreName(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm" required />
              </div>

              <div>
                <label className="text-gray-300 text-sm font-semibold block mb-2">Ciudad *</label>
                <input type="text" placeholder="Ej: Providencia, Santiago" value={reqCity} onChange={e => setReqCity(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm" required />
              </div>

              <div>
                <label className="text-gray-300 text-sm font-semibold block mb-2">Teléfono</label>
                <input type="text" placeholder="+56 9 1234 5678" value={reqPhone} onChange={e => setReqPhone(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-300 text-sm font-semibold block mb-2">Dirección</label>
                <input type="text" placeholder="Ej: Av. Las Condes 8900, Local 3" value={reqAddress} onChange={e => setReqAddress(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-300 text-sm font-semibold block mb-2">Descripción del negocio</label>
                <textarea placeholder="Cuéntanos qué tipo de productos vendes y a quién va dirigido tu almacén..." value={reqDescription} onChange={e => setReqDescription(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm h-24 resize-none" />
              </div>

              <div className="md:col-span-2">
                <button type="submit" disabled={storeReqLoading}
                  className="bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 px-8 rounded-xl font-bold text-white hover:scale-[1.02] transition shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-2">
                  {storeReqLoading ? (
                    <><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Enviando solicitud...</>
                  ) : "📋 Enviar Solicitud de Almacén"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-10">

          {/* MIS PEDIDOS */}
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-emerald-400 flex items-center gap-2">📦 Mis Pedidos</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {clientOrders.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-[28px] p-10 text-center">
                  <p className="text-gray-400 mb-4">No has realizado pedidos aún.</p>
                  <Link href="/stores" className="inline-block bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 py-3 rounded-xl font-bold hover:scale-105 transition text-sm">
                    Ir a Comprar 🛒
                  </Link>
                </div>
              ) : (
                clientOrders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-3 hover:border-emerald-500/30 transition">
                    <div className="flex justify-between items-center flex-wrap gap-2 border-b border-white/5 pb-3">
                      <div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">{order.id}</span>
                        <p className="text-[10px] text-gray-500">{new Date(order.date).toLocaleDateString("es-CL")}</p>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                        order.status === "Pendiente" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" :
                        order.status === "Preparando" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse" :
                        order.status === "Entregado" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" :
                        "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      }`}>{order.status}</span>
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-300">
                        <span>{item.title} <strong className="text-gray-500">x{item.quantity}</strong></span>
                        <span>${(item.price * item.quantity).toLocaleString("es-CL")}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-2 flex justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[200px]">📍 {order.address}</span>
                      <span className="font-bold text-emerald-400">Total: ${order.total.toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DIRECCIONES */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white">➕ Direcciones de Envío</h2>
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6">
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <input type="text" placeholder="Nombre del receptor" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white" required />
                <input type="text" placeholder="Teléfono móvil" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white" required />
                <input type="text" placeholder="Ciudad" value={city} onChange={e => setCity(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white" required />
                <textarea placeholder="Calle, numeración, depto..." value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white h-24 resize-none" required />
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 py-3 rounded-xl font-bold hover:scale-[1.02] transition cursor-pointer">
                  Guardar Dirección
                </button>
              </form>
            </div>

            {clientAddresses.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {clientAddresses.map(addr => (
                  <div key={addr.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-1.5 hover:border-emerald-500/20 transition">
                    <h4 className="font-bold text-emerald-400 text-sm">{addr.full_name}</h4>
                    <p className="text-gray-400">📞 {addr.phone}</p>
                    <p className="text-gray-400">📍 {addr.address}, {addr.city}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}