"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Product, Order, Sale, CajaSession } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

// Ítem de carrito para venta presencial
type CartItem = {
  product: Product;
  quantity: number;
};

export default function SellerPage() {
  const { showToast } = useToast();
  const { loading: authLoading, profile } = useAuthGuard("seller");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [sales, setSales]       = useState<Sale[]>([]);
  const [caja, setCaja]         = useState<CajaSession | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "pos">("dashboard");

  // POS
  const [posAmount, setPosAmount]   = useState("");
  const [posDetails, setPosDetails] = useState("");

  // POS Presencial (carrito)
  const [posCart, setPosCart]           = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showScanner, setShowScanner]   = useState(false);
  const [posSearching, setPosSearching] = useState(false);

  const storeId = profile?.store_id || 1;

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [prodData, orderData, salesData, cajaData] = await Promise.all([
        dbService.getProducts(storeId),
        dbService.getOrders(storeId),
        dbService.getSales(storeId),
        dbService.getCajaSession(storeId),
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setSales(salesData);
      setCaja(cajaData);
    } catch (err) {
      console.error("Error cargando datos seller:", err);
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

  // ── POS simple (monto manual) ────────────────────────────
  const handleRegisterPOS = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(posAmount);
    if (isNaN(amount) || amount <= 0) { showToast("Monto inválido", "error"); return; }
    if (caja && !caja.isOpen) { showToast("La caja del almacén está cerrada. Contacta al dueño.", "error"); return; }
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

  // ── POS Presencial con carrito ────────────────────────────
  const findProductByBarcode = (code: string): Product | null =>
    products.find(p => p.barcode && p.barcode.trim() === code.trim()) || null;

  const addToCartByCode = (code: string) => {
    const prod = findProductByBarcode(code);
    if (!prod) {
      showToast(`No se encontró producto con código: ${code}`, "error");
      setBarcodeInput("");
      return;
    }
    if (prod.stock <= 0) {
      showToast(`"${prod.title}" no tiene stock disponible`, "error");
      return;
    }
    setPosCart(prev => {
      const existing = prev.find(i => i.product.id === prod.id);
      if (existing) {
        if (existing.quantity >= prod.stock) {
          showToast("Stock máximo alcanzado para este producto", "error");
          return prev;
        }
        return prev.map(i => i.product.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
    showToast(`✓ ${prod.title} agregado`, "success");
    setBarcodeInput("");
  };

  const handleBarcodeManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) addToCartByCode(barcodeInput.trim());
  };

  const handleScanDetected = (code: string) => {
    setShowScanner(false);
    addToCartByCode(code);
  };

  const updateCartQty = (prodId: number, delta: number) => {
    setPosCart(prev => prev
      .map(i => i.product.id === prodId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const cartTotal = posCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handlePosCheckout = async () => {
    if (posCart.length === 0) { showToast("El carrito está vacío", "error"); return; }
    if (caja && !caja.isOpen) { showToast("La caja está cerrada. Contacta al dueño.", "error"); return; }
    setPosSearching(true);
    const details = posCart.map(i => `${i.product.title} x${i.quantity}`).join(", ");
    await dbService.registerPresencialSale(storeId, cartTotal, details);
    // Descontar stock
    for (const item of posCart) {
      await dbService.updateProductStock(item.product.id, item.product.stock - item.quantity);
    }
    await dbService.logActivity(
      storeId, "sale_presencial",
      `Venta presencial: ${details} — $${cartTotal.toLocaleString("es-CL")}`,
      { amount: cartTotal, items: posCart.map(i => ({ id: i.product.id, qty: i.quantity, title: i.product.title })) }
    );
    showToast(`✅ Venta completada por $${cartTotal.toLocaleString("es-CL")}`, "success");
    setPosCart([]);
    setPosSearching(false);
    void loadData();
  };

  if (authLoading || localLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando consola de vendedor...</p>
      </main>
    );
  }

  const todaySales   = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayTotal   = todaySales.reduce((sum, s) => sum + s.amount, 0);
  const activeOrders = orders.filter(o => o.status === "Pendiente" || o.status === "Preparando");
  const criticalStock = products.filter(p => p.stock <= p.minStock);

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white">💼 Consola Vendedor</h1>
            <p className="text-gray-400 mt-1">
              Hola, <strong className="text-blue-300">{profile?.full_name}</strong> · Almacén #{storeId}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {caja?.isOpen ? (
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black px-4 py-2 rounded-full">● Caja Abierta</span>
            ) : (
              <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black px-4 py-2 rounded-full">● Caja Cerrada</span>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ventas de Hoy",      value: `$${todayTotal.toLocaleString("es-CL")}`, color: "text-emerald-400", icon: "💵" },
            { label: "Transacciones Hoy",  value: `${todaySales.length}`,                    color: "text-blue-300",    icon: "🧾" },
            { label: "Pedidos Activos",    value: `${activeOrders.length}`,                  color: "text-yellow-300",  icon: "📦" },
            { label: "Stock Crítico",      value: `${criticalStock.length}`,                 color: criticalStock.length > 0 ? "text-rose-400 animate-pulse" : "text-white", icon: "⚠️" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[22px] p-5 hover:border-blue-400/30 transition">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{kpi.icon} {kpi.label}</p>
              <h3 className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</h3>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit overflow-x-auto">
          {[
            { key: "dashboard", label: "📊 Dashboard" },
            { key: "orders",    label: "📦 Pedidos", badge: activeOrders.length },
            { key: "pos",       label: "🛒 Venta en Persona" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-blue-500/30 border border-blue-400/40 text-blue-200"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="bg-blue-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: DASHBOARD ─────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* POS Express */}
            <div className="bg-gradient-to-br from-blue-950/30 to-black border border-blue-500/20 rounded-[30px] p-6">
              <h3 className="font-black text-blue-300 text-lg flex items-center gap-2 mb-4">
                ⚡ POS Express
                <span className="text-[10px] bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full">Monto Directo</span>
              </h3>
              {caja && !caja.isOpen && (
                <div className="mb-4 p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  ⚠️ La caja está cerrada. Solo el dueño del almacén puede abrirla.
                </div>
              )}
              <form onSubmit={handleRegisterPOS} className="space-y-3">
                <input type="number" placeholder="Monto Venta ($)" value={posAmount} onChange={e => setPosAmount(e.target.value)}
                  className="w-full bg-black/40 border border-blue-400/20 rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-white text-sm"
                  disabled={caja ? !caja.isOpen : false} required />
                <input type="text" placeholder="Detalle (ej: Pan y cecinas)" value={posDetails} onChange={e => setPosDetails(e.target.value)}
                  className="w-full bg-black/40 border border-blue-400/20 rounded-xl px-4 py-3 outline-none focus:border-blue-400 text-white text-sm"
                  disabled={caja ? !caja.isOpen : false} required />
                <button type="submit" disabled={caja ? !caja.isOpen : false}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3 rounded-xl text-sm transition disabled:opacity-40 cursor-pointer">
                  ➕ Registrar Venta
                </button>
              </form>
            </div>

            {/* Inventario (solo lectura) */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6">
              <h3 className="font-black text-white text-lg mb-4">📦 Inventario del Almacén</h3>
              <p className="text-gray-500 text-xs mb-3">Vista de solo lectura — ajustes de stock: contacta al dueño</p>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                {products.map(p => {
                  const isCritical = p.stock <= p.minStock;
                  return (
                    <div key={p.id} className={`flex justify-between items-center p-3 rounded-xl border ${isCritical ? "bg-rose-950/10 border-rose-500/20" : "bg-black/20 border-white/5"}`}>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{p.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold ${isCritical ? "text-rose-400" : "text-emerald-400"}`}>
                            Stock: {p.stock} u. {isCritical && "⚠️"}
                          </span>
                          {p.barcode && (
                            <span className="text-[10px] text-gray-500 font-mono">〡{p.barcode}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-cyan-400 font-bold text-xs">${p.price.toLocaleString("es-CL")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PEDIDOS ───────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">📦 Pedidos a Gestionar</h2>
            {activeOrders.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[25px] p-12 text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-gray-400 text-sm">No hay pedidos pendientes por el momento.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-[20px] p-4 hover:border-blue-400/30 transition">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-xs font-mono text-blue-400 font-bold">{order.id}</span>
                        <h4 className="text-sm font-bold">{order.customer_name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          order.status === "Pendiente" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" :
                          "bg-blue-500/10 border-blue-500/30 text-blue-300 animate-pulse"
                        }`}>{order.status}</span>
                        {order.status === "Pendiente" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "Preparando")}
                            className="bg-blue-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg hover:bg-blue-600 transition cursor-pointer">
                            Preparar
                          </button>
                        )}
                        {order.status === "Preparando" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "Entregado")}
                            className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg hover:bg-emerald-600 transition cursor-pointer">
                            Entregar
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-[10px] truncate">📍 {order.address}</p>
                    <p className="text-blue-300 font-bold text-xs mt-1">Total: ${order.total.toLocaleString("es-CL")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: VENTA EN PERSONA ──────────────────────── */}
        {activeTab === "pos" && (
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Panel izquierdo: búsqueda + productos */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-950/30 to-black border border-blue-500/20 rounded-[30px] p-6">
                <h3 className="font-black text-blue-200 text-lg mb-1">🛒 Venta Presencial</h3>
                <p className="text-gray-400 text-xs mb-4">Agrega productos escaneando o ingresando el código de barras.</p>

                {caja && !caja.isOpen && (
                  <div className="mb-4 p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                    ⚠️ La caja está cerrada. Contacta al dueño para abrirla.
                  </div>
                )}

                {/* Buscador de código de barras */}
                <form onSubmit={handleBarcodeManual} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Código de barras..."
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-blue-400/20 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 text-white text-sm font-mono"
                  />
                  <button type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-black px-4 py-2.5 rounded-xl text-sm transition cursor-pointer">
                    + Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 font-black px-4 py-2.5 rounded-xl text-sm transition cursor-pointer"
                    title="Escanear con cámara"
                  >
                    📷
                  </button>
                </form>

                {/* Lista de productos disponibles */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-2">Catálogo del almacén</p>
                  {products.map(p => {
                    const inCart = posCart.find(i => i.product.id === p.id);
                    const isCritical = p.stock <= p.minStock;
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        inCart ? "bg-blue-500/10 border-blue-400/30" : "bg-black/20 border-white/5 hover:border-white/20"
                      }`}>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-blue-300 font-bold text-[11px]">${p.price.toLocaleString("es-CL")}</span>
                            <span className={`text-[10px] ${isCritical ? "text-rose-400" : "text-gray-500"}`}>
                              Stock: {p.stock}
                            </span>
                            {p.barcode && (
                              <span className="text-gray-600 text-[9px] font-mono">〡{p.barcode}</span>
                            )}
                          </div>
                        </div>
                        <button
                          disabled={p.stock <= 0}
                          onClick={() => {
                            setPosCart(prev => {
                              const existing = prev.find(i => i.product.id === p.id);
                              if (existing) {
                                if (existing.quantity >= p.stock) { showToast("Stock máximo alcanzado", "error"); return prev; }
                                return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
                              }
                              return [...prev, { product: p, quantity: 1 }];
                            });
                            if (p.stock > 0) showToast(`✓ ${p.title}`, "success");
                          }}
                          className="ml-3 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-300 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                          {p.stock <= 0 ? "Sin stock" : "+ Agregar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Panel derecho: carrito */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 flex flex-col">
              <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2">
                🧾 Carrito
                {posCart.length > 0 && (
                  <span className="bg-blue-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {posCart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </h3>

              {posCart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-gray-500 text-sm">El carrito está vacío</p>
                  <p className="text-gray-600 text-xs mt-1">Escanea o selecciona un producto</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[360px]">
                    {posCart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between bg-black/30 border border-white/5 p-3 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.product.title}</h4>
                          <p className="text-blue-300 text-[11px]">${(item.product.price * item.quantity).toLocaleString("es-CL")}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button onClick={() => updateCartQty(item.product.id, -1)}
                            className="w-7 h-7 bg-white/10 border border-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-black transition cursor-pointer flex items-center justify-center">
                            −
                          </button>
                          <span className="text-white font-black text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-7 h-7 bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 rounded-lg text-blue-300 text-sm font-black transition cursor-pointer flex items-center justify-center disabled:opacity-30">
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total y checkout */}
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-bold">Total a cobrar</span>
                      <span className="text-2xl font-black text-emerald-400">${cartTotal.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPosCart([])}
                        className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-3 rounded-xl text-sm hover:border-white/20 transition cursor-pointer">
                        🗑 Vaciar
                      </button>
                      <button
                        onClick={() => void handlePosCheckout()}
                        disabled={posSearching || !caja?.isOpen}
                        className="flex-[2] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black py-3 rounded-xl text-sm hover:opacity-90 transition cursor-pointer disabled:opacity-40"
                      >
                        {posSearching ? "Procesando..." : `✅ Cobrar $${cartTotal.toLocaleString("es-CL")}`}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scanner modal */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </main>
  );
}
