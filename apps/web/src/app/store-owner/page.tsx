"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  dbService, Product, Order, Sale, CajaSession,
  StoreMember, SellerProfile, ActivityLog
} from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";

const ACTION_LABELS: Record<string, { icon: string; color: string }> = {
  sale_presencial:  { icon: "💵", color: "text-emerald-400" },
  sale_online:      { icon: "🛒", color: "text-blue-400"    },
  stock_update:     { icon: "📦", color: "text-cyan-400"    },
  order_status:     { icon: "📋", color: "text-yellow-300"  },
  invite_sent:      { icon: "📨", color: "text-purple-400"  },
  invite_accepted:  { icon: "✅", color: "text-emerald-400" },
  invite_rejected:  { icon: "❌", color: "text-rose-400"    },
  caja_open:        { icon: "🟢", color: "text-emerald-400" },
  caja_close:       { icon: "🔴", color: "text-rose-400"    },
};

export default function StoreOwnerPage() {
  const { showToast } = useToast();
  const { loading: authLoading, profile } = useAuthGuard("store_owner");

  const [products, setProducts]   = useState<Product[]>([]);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [sales, setSales]         = useState<Sale[]>([]);
  const [caja, setCaja]           = useState<CajaSession | null>(null);
  const [members, setMembers]     = useState<StoreMember[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([]);
  const [activityLogs, setActivityLogs]     = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "sellers" | "caja" | "logs">("dashboard");
  const [localLoading, setLocalLoading] = useState(true);

  // Caja forms
  const [cajaBase, setCajaBase]           = useState("");
  const [posAmount, setPosAmount]         = useState("");
  const [posDetails, setPosDetails]       = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDesc, setWithdrawDesc]   = useState("");
  const [showWithdrawForm, setShowWithdrawForm]     = useState(false);
  const [showCloseCajaConfirm, setShowCloseCajaConfirm] = useState(false);

  // Seller invite
  const [sellerEmail, setSellerEmail]   = useState("");
  const [sellerLoading, setSellerLoading] = useState(false);

  // Logs filter
  const [logsFilter, setLogsFilter] = useState<string>("all");
  const [selectedSellerId, setSelectedSellerId] = useState<string>("all");

  // Seller detail modal
  const [detailSeller, setDetailSeller] = useState<SellerProfile | null>(null);

  const storeId = profile?.store_id || 1;

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [prodData, orderData, salesData, cajaData, membersData, spData, logsData] = await Promise.all([
        dbService.getProducts(storeId),
        dbService.getOrders(storeId),
        dbService.getSales(storeId),
        dbService.getCajaSession(storeId),
        dbService.getStoreMembersForStore(storeId),
        dbService.getSellerProfiles(storeId),
        dbService.getActivityLogs(storeId, 200),
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setSales(salesData);
      setCaja(cajaData);
      setMembers(membersData);
      setSellerProfiles(spData);
      setActivityLogs(logsData);
    } catch (err) {
      console.error("Error cargando datos store-owner:", err);
    } finally {
      setLocalLoading(false);
    }
  }, [profile?.id, storeId]);

  useEffect(() => {
    if (authLoading || !profile) return;
    void loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [authLoading, loadData, profile]);

  // ── Caja handlers ────────────────────────────────────────────
  const handleOpenCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = Number(cajaBase);
    if (isNaN(base) || base <= 0) { showToast("Monto base inválido", "error"); return; }
    const updated = await dbService.openCaja(storeId, base);
    setCaja(updated); setCajaBase("");
    showToast(`Caja abierta. Saldo inicial: $${base.toLocaleString("es-CL")}`, "success");
    await dbService.logActivity(storeId, "caja_open", `Caja abierta con $${base.toLocaleString("es-CL")}`);
    void loadData();
  };

  const handleCloseCaja = async () => {
    const updated = await dbService.closeCaja(storeId);
    setCaja(updated); setShowCloseCajaConfirm(false);
    showToast("Caja cerrada y balance archivado", "info");
    await dbService.logActivity(storeId, "caja_close", `Caja cerrada. Saldo final: $${updated.currentAmount.toLocaleString("es-CL")}`);
    void loadData();
  };

  const handleWithdrawCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) { showToast("Monto inválido", "error"); return; }
    if (caja && amount > caja.currentAmount) { showToast("Saldo insuficiente en caja", "error"); return; }
    const updated = await dbService.withdrawCaja(storeId, amount, withdrawDesc);
    setCaja(updated); setWithdrawAmount(""); setWithdrawDesc(""); setShowWithdrawForm(false);
    showToast(`Retiro registrado: $${amount.toLocaleString("es-CL")}`, "warning");
    void loadData();
  };

  const handleRegisterPOS = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(posAmount);
    if (isNaN(amount) || amount <= 0) { showToast("Monto inválido", "error"); return; }
    if (caja && !caja.isOpen) { showToast("Debes abrir la caja antes de registrar ventas", "error"); return; }
    await dbService.registerPresencialSale(storeId, amount, posDetails);
    await dbService.logActivity(storeId, "sale_presencial", `Venta POS: ${posDetails} — $${amount.toLocaleString("es-CL")}`, { amount, details: posDetails });
    setPosAmount(""); setPosDetails("");
    showToast(`¡Venta registrada por $${amount.toLocaleString("es-CL")}!`, "success");
    void loadData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    await dbService.updateOrderStatus(orderId, status);
    await dbService.logActivity(storeId, "order_status", `Pedido ${orderId} → ${status}`);
    showToast(`Pedido ${orderId} → ${status}`, "success");
    void loadData();
  };

  const handleReponerStock = async (prodId: number, currentStock: number, title: string) => {
    await dbService.updateProductStock(prodId, currentStock + 10);
    await dbService.logActivity(storeId, "stock_update", `Stock repuesto: ${title} (+10 unidades)`);
    showToast("Stock abastecido (+10 unidades)", "success");
    void loadData();
  };

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerEmail.trim()) return;
    setSellerLoading(true);
    // Usar nuevo RPC que envía invitación + notificación
    const result = await dbService.sendSellerInvite(storeId, sellerEmail.trim());
    if (result.success) {
      showToast(result.message, "success");
      setSellerEmail("");
      await dbService.logActivity(storeId, "invite_sent", `Invitación enviada a ${sellerEmail.trim()}`);
      void loadData();
    } else {
      showToast(result.message, "error");
    }
    setSellerLoading(false);
  };

  const handleRemoveSeller = async (memberId: string, userId: string, name: string) => {
    await dbService.removeSellerFromStore(memberId, userId);
    showToast("Vendedor removido del almacén", "warning");
    await dbService.logActivity(storeId, "invite_rejected", `Vendedor ${name} fue removido del almacén`);
    void loadData();
  };

  if (authLoading || localLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando consola del almacén...</p>
      </main>
    );
  }

  // Métricas
  const totalSalesAmount   = sales.reduce((sum, s) => sum + s.amount, 0);
  const todaySalesAmount   = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.amount, 0);
  const activeOrdersCount  = orders.filter(o => o.status === "Pendiente" || o.status === "Preparando").length;
  const criticalStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Logs filtrados
  const filteredLogs = activityLogs.filter(log => {
    const typeOk   = logsFilter === "all" || log.action_type === logsFilter;
    const sellerOk = selectedSellerId === "all" || log.user_id === selectedSellerId;
    return typeOk && sellerOk;
  });

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full bottom-0 right-0" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white">🏪 Mi Almacén</h1>
            <p className="text-gray-400 mt-1">
              Bienvenido, <strong className="text-cyan-300">{profile?.full_name}</strong> · Dueño de Almacén
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-[1.03] transition shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2"
            >
              ⚙️ Gestionar Inventario
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ventas de Hoy",    value: `$${todaySalesAmount.toLocaleString("es-CL")}`,   color: "text-emerald-400", icon: "💵" },
            { label: "Ingresos Totales", value: `$${totalSalesAmount.toLocaleString("es-CL")}`,   color: "text-cyan-400",    icon: "📈" },
            { label: "Pedidos Activos",  value: `${activeOrdersCount}`,                            color: "text-yellow-300",  icon: "📦" },
            { label: "Stock Crítico",    value: `${criticalStockCount} alertas`,                   color: criticalStockCount > 0 ? "text-rose-400 animate-pulse" : "text-white", icon: "⚠️" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[22px] p-5 hover:border-cyan-400/30 transition">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{kpi.icon} {kpi.label}</p>
              <h3 className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</h3>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit overflow-x-auto">
          {[
            { key: "dashboard", label: "📊 Resumen" },
            { key: "orders",    label: "📦 Pedidos",   badge: activeOrdersCount },
            { key: "caja",      label: "💵 Caja" },
            { key: "sellers",   label: "💼 Vendedores", badge: members.length },
            { key: "logs",      label: "📋 Historial",  badge: 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-cyan-500/30 border border-cyan-400/40 text-cyan-300"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="bg-cyan-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: DASHBOARD ─────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inventario crítico */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">⚠️ Stock Crítico</h3>
              {products.filter(p => p.stock <= p.minStock).length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">✅ Todo el inventario está en nivel óptimo.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {products.filter(p => p.stock <= p.minStock).map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{p.title}</h4>
                        <span className="text-[10px] text-rose-400 font-bold">Stock: {p.stock} u. ⚠️</span>
                      </div>
                      <button
                        onClick={() => handleReponerStock(p.id, p.stock, p.title)}
                        className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-rose-600 transition cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ventas recientes */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">📋 Ventas Recientes</h3>
              {sales.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No hay ventas registradas aún.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {sales.slice(0, 10).map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                      <div>
                        <span className="text-gray-400 font-mono">{new Date(s.date).toLocaleDateString("es-CL")}</span>
                        <p className="text-gray-300 text-[11px] truncate max-w-[200px]">{s.details}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">${s.amount.toLocaleString("es-CL")}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.type === "online" ? "bg-blue-500/20 text-blue-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                          {s.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: PEDIDOS ───────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black">📦 Gestión de Pedidos</h2>
            {orders.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-16 text-center">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-gray-400">No hay pedidos registrados para tu almacén.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-[22px] p-5 hover:border-cyan-400/30 transition">
                    <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-white/5 mb-3">
                      <div>
                        <span className="text-xs font-mono text-cyan-400 font-bold">{order.id}</span>
                        <h4 className="text-sm font-bold">{order.customer_name}</h4>
                        <p className="text-[10px] text-gray-500">{new Date(order.date).toLocaleString("es-CL")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                          order.status === "Pendiente"  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" :
                          order.status === "Preparando" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse" :
                          order.status === "Entregado"  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" :
                          "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}>{order.status}</span>
                        {order.status === "Pendiente" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "Preparando")}
                            className="bg-cyan-400 text-black text-[10px] font-black px-3 py-1 rounded-lg hover:scale-105 transition cursor-pointer">
                            Preparar ⚙️
                          </button>
                        )}
                        {order.status === "Preparando" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "Entregado")}
                            className="bg-emerald-400 text-black text-[10px] font-black px-3 py-1 rounded-lg hover:scale-105 transition cursor-pointer">
                            Entregar ✓
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <p className="text-gray-500 truncate max-w-[250px]">📍 {order.address}</p>
                      <p className="font-bold text-cyan-400">Total: ${order.total.toLocaleString("es-CL")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CAJA ──────────────────────────────────── */}
        {activeTab === "caja" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">💵 Control de Caja</h2>
              {caja?.isOpen ? (
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase">● Caja Abierta</span>
                  {!showCloseCajaConfirm ? (
                    <button onClick={() => setShowCloseCajaConfirm(true)}
                      className="bg-rose-950/60 border border-rose-500/30 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-rose-400 text-xs font-black transition cursor-pointer">
                      Cerrar Caja
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-semibold">¿Confirmar cierre?</span>
                      <button onClick={() => void handleCloseCaja()} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-xs font-black cursor-pointer">Sí, cerrar</button>
                      <button onClick={() => setShowCloseCajaConfirm(false)} className="bg-white/10 text-gray-300 px-4 py-1.5 rounded-lg text-xs cursor-pointer">Cancelar</button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase">● Caja Cerrada</span>
              )}
            </div>

            {!caja?.isOpen ? (
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 max-w-md">
                <p className="text-gray-400 text-sm mb-4">La caja está cerrada. Ábrela para empezar a registrar ventas.</p>
                <form onSubmit={handleOpenCaja} className="flex gap-3">
                  <input type="number" placeholder="Monto base (ej: 50000)" value={cajaBase} onChange={e => setCajaBase(e.target.value)}
                    className="flex-1 bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm" required />
                  <button type="submit" className="bg-cyan-400 text-black font-black px-5 py-3 rounded-xl hover:scale-[1.03] transition cursor-pointer text-sm">Abrir</button>
                </form>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Saldo */}
                <div className="bg-gradient-to-br from-cyan-950/30 to-black border border-cyan-500/20 rounded-[25px] p-6 space-y-4">
                  <p className="text-gray-400 text-xs font-bold uppercase">Saldo Actual</p>
                  <h3 className="text-4xl font-black text-cyan-400">${caja.currentAmount.toLocaleString("es-CL")}</h3>
                  <div className="text-xs space-y-1 border-t border-white/10 pt-3">
                    <div className="flex justify-between"><span className="text-gray-400">Base apertura:</span><span>${caja.baseAmount.toLocaleString("es-CL")}</span></div>
                    <div className="flex justify-between font-bold"><span className="text-gray-400">Ingresos:</span><span className="text-emerald-400">+${(caja.currentAmount - caja.baseAmount).toLocaleString("es-CL")}</span></div>
                  </div>
                  <button onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                    className="w-full border border-yellow-500/30 hover:border-yellow-500 bg-yellow-500/10 text-yellow-300 py-2.5 rounded-xl text-xs font-black transition cursor-pointer">
                    {showWithdrawForm ? "Cancelar" : "⚠️ Registrar Retiro"}
                  </button>
                </div>

                {/* POS o Retiro */}
                {showWithdrawForm ? (
                  <form onSubmit={handleWithdrawCaja} className="space-y-4 bg-yellow-500/5 border border-yellow-500/20 rounded-[25px] p-6">
                    <h3 className="font-bold text-yellow-300 text-sm">Registrar Retiro o Pago</h3>
                    <input type="number" placeholder="Monto ($)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full bg-black/40 border border-yellow-500/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-yellow-400 text-white" required />
                    <input type="text" placeholder="Detalle (ej: Pago proveedor)" value={withdrawDesc} onChange={e => setWithdrawDesc(e.target.value)}
                      className="w-full bg-black/40 border border-yellow-500/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-yellow-400 text-white" required />
                    <button type="submit" className="w-full bg-yellow-500 text-black font-black py-2.5 rounded-xl text-xs hover:scale-[1.02] transition cursor-pointer">Confirmar Retiro</button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterPOS} className="space-y-4 bg-white/5 border border-white/10 rounded-[25px] p-6">
                    <h3 className="font-black text-cyan-400 text-sm flex items-center gap-2">⚡ POS Express <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full">Venta Directa</span></h3>
                    <input type="number" placeholder="Monto Venta ($)" value={posAmount} onChange={e => setPosAmount(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-400 text-white" required />
                    <input type="text" placeholder="Detalle (ej: Pan y cecinas)" value={posDetails} onChange={e => setPosDetails(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-400 text-white" required />
                    <button type="submit" className="w-full bg-cyan-400 text-black font-black py-2.5 rounded-xl text-xs hover:scale-[1.02] transition cursor-pointer">➕ Registrar Venta</button>
                  </form>
                )}

                {/* Historial */}
                <div className="bg-black/40 border border-white/5 rounded-[25px] p-5">
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Movimientos de Caja</h4>
                  <div className="space-y-2 overflow-y-auto max-h-[200px] pr-2">
                    {caja.history.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                        <div>
                          <span className="text-gray-500 font-mono">{h.time}</span>
                          <p className="font-semibold text-gray-300 truncate max-w-[150px]">{h.description}</p>
                        </div>
                        <span className={`font-bold ${h.type === "Apertura" ? "text-cyan-400" : h.type === "Retiro" ? "text-yellow-400" : h.type === "Cierre" ? "text-rose-400" : "text-emerald-400"}`}>
                          {h.type === "Retiro" ? "-" : "+"}${h.amount.toLocaleString("es-CL")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: VENDEDORES ────────────────────────────── */}
        {activeTab === "sellers" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">💼 Equipo de Vendedores</h2>

            {/* Formulario invitar */}
            <div className="bg-white/5 border border-white/10 rounded-[25px] p-6 max-w-xl">
              <h3 className="font-bold text-white mb-2">✉️ Invitar Vendedor por Email</h3>
              <p className="text-gray-400 text-xs mb-4">Se enviará una notificación al usuario para que acepte y complete su perfil de vendedor.</p>
              <form onSubmit={handleAddSeller} className="flex gap-3">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={sellerEmail}
                  onChange={e => setSellerEmail(e.target.value)}
                  className="flex-1 bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white text-sm"
                  required
                />
                <button type="submit" disabled={sellerLoading}
                  className="bg-cyan-400 text-black font-black px-5 py-3 rounded-xl hover:scale-[1.03] transition cursor-pointer text-sm disabled:opacity-50 whitespace-nowrap">
                  {sellerLoading ? "..." : "Invitar 📨"}
                </button>
              </form>
            </div>

            {/* Lista de vendedores con perfil */}
            {members.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[25px] p-12 text-center">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-gray-400">No tienes vendedores asignados a tu almacén aún.</p>
                <p className="text-gray-500 text-xs mt-2">Invita a alguien usando el formulario de arriba.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(member => {
                  const sp = sellerProfiles.find(s => s.user_id === member.user_id);
                  return (
                    <div key={member.id} className="bg-white/5 border border-blue-500/20 rounded-[22px] p-5 hover:border-blue-400/30 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-xl">
                          💼
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setDetailSeller(sp || null)}
                            disabled={!sp}
                            title={sp ? "Ver perfil completo" : "Sin perfil completo aún"}
                            className="bg-white/5 border border-white/10 hover:border-cyan-400/40 text-gray-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            👁 Ver
                          </button>
                          <button
                            onClick={() => handleRemoveSeller(member.id, member.user_id, sp?.full_name || member.user_name || "Vendedor")}
                            className="bg-red-950/40 border border-red-500/20 hover:bg-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-red-400 text-xs font-bold transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-sm">{sp?.full_name || member.user_name || "Vendedor"}</h4>
                      <p className="text-blue-300 text-xs">{member.user_email || sp?.user_email}</p>
                      {sp?.rut && <p className="text-gray-500 text-[10px] mt-1">RUT: {sp.rut}</p>}
                      {sp?.phone && <p className="text-gray-500 text-[10px]">📞 {sp.phone}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">SELLER</span>
                        {sp ? (
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">✓ Perfil completo</span>
                        ) : (
                          <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">⏳ Pendiente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: HISTORIAL ─────────────────────────────── */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-black">📋 Registro de Actividad</h2>
              <div className="flex gap-2 flex-wrap">
                {/* Filtro por tipo */}
                <select
                  value={logsFilter}
                  onChange={e => setLogsFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 text-gray-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">Todas las acciones</option>
                  <option value="sale_presencial">💵 Ventas presenciales</option>
                  <option value="sale_online">🛒 Ventas online</option>
                  <option value="stock_update">📦 Cambios de stock</option>
                  <option value="order_status">📋 Pedidos</option>
                  <option value="invite_sent">📨 Invitaciones</option>
                  <option value="invite_accepted">✅ Invitaciones aceptadas</option>
                  <option value="caja_open">🟢 Apertura caja</option>
                  <option value="caja_close">🔴 Cierre caja</option>
                </select>
                {/* Filtro por vendedor */}
                <select
                  value={selectedSellerId}
                  onChange={e => setSelectedSellerId(e.target.value)}
                  className="bg-white/5 border border-white/10 text-gray-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">Todos los usuarios</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {sellerProfiles.find(s => s.user_id === m.user_id)?.full_name || m.user_name || m.user_email || "Vendedor"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-16 text-center">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-gray-400">No hay registros con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-[30px] overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0d1117] border-b border-white/10">
                      <tr>
                        <th className="text-left text-gray-400 font-bold uppercase tracking-wide px-5 py-3">Fecha</th>
                        <th className="text-left text-gray-400 font-bold uppercase tracking-wide px-5 py-3">Usuario</th>
                        <th className="text-left text-gray-400 font-bold uppercase tracking-wide px-5 py-3">Acción</th>
                        <th className="text-left text-gray-400 font-bold uppercase tracking-wide px-5 py-3">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, i) => {
                        const meta = ACTION_LABELS[log.action_type] || { icon: "🔹", color: "text-gray-300" };
                        const sp = sellerProfiles.find(s => s.user_id === log.user_id);
                        const isOwner = log.user_id === profile?.id;
                        const displayName = log.user_name || sp?.full_name || (isOwner ? (profile?.full_name || "Dueño") : "Sistema");
                        const displayEmail = log.user_email || sp?.user_email || (isOwner ? profile?.email : "");
                        return (
                          <tr key={log.id} className={`border-b border-white/5 hover:bg-white/5 transition ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                            <td className="px-5 py-3 font-mono text-gray-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-5 py-3">
                              <p className="text-white font-bold">{displayName}</p>
                              {displayEmail && <p className="text-gray-500 text-[10px]">{displayEmail}</p>}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`${meta.color} font-black`}>{meta.icon} {log.action_type.replace(/_/g, " ")}</span>
                            </td>
                            <td className="px-5 py-3 text-gray-300 max-w-[300px]">
                              <p className="truncate">{log.description}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: Perfil detallado del vendedor ── */}
      {detailSeller && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d1117] border border-blue-500/20 rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <div>
                <h3 className="font-black text-white text-lg">💼 Perfil de Vendedor</h3>
                <p className="text-blue-300 text-xs mt-0.5">{detailSeller.user_email}</p>
              </div>
              <button onClick={() => setDetailSeller(null)} className="text-gray-400 hover:text-white text-2xl cursor-pointer">×</button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Nombre Completo", value: detailSeller.full_name, icon: "👤" },
                { label: "RUT",             value: detailSeller.rut,       icon: "🪪" },
                { label: "Fecha Nacimiento",value: detailSeller.birthdate ? new Date(detailSeller.birthdate).toLocaleDateString("es-CL") : "—", icon: "🎂" },
                { label: "Teléfono",        value: detailSeller.phone || "—",    icon: "📞" },
                { label: "Dirección",       value: detailSeller.address || "—",  icon: "📍" },
              ].map(field => (
                <div key={field.label} className="flex gap-3 items-start">
                  <span className="text-lg mt-0.5">{field.icon}</span>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">{field.label}</p>
                    <p className="text-white text-sm font-semibold">{field.value}</p>
                  </div>
                </div>
              ))}
              {detailSeller.experience && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg mt-0.5">📝</span>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Experiencia</p>
                    <p className="text-gray-300 text-xs leading-relaxed">{detailSeller.experience}</p>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-white/10">
                <p className="text-gray-500 text-[10px]">Miembro desde: {new Date(detailSeller.created_at).toLocaleDateString("es-CL")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
