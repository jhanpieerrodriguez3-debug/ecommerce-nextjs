"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Product, Order, Sale, CajaSession } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";
import { GridSkeleton } from "@/components/Skeleton";

export default function DashboardPage() {
  const { showToast } = useToast();
  
  // 1. Proteger la ruta y obtener el perfil logueado
  const { loading: authLoading, profile } = useAuthGuard();

  // Estados del Administrador
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [caja, setCaja] = useState<CajaSession | null>(null);
  
  // Estados de Formularios del Admin
  const [posAmount, setPosAmount] = useState("");
  const [posDetails, setPosDetails] = useState("");
  const [cajaBase, setCajaBase] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showCloseCajaConfirm, setShowCloseCajaConfirm] = useState(false);

  // Estados del Cliente
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [clientAddresses, setClientAddresses] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [localLoading, setLocalLoading] = useState(true);

  // Cargar datos según el rol (memoizada con useCallback)
  const loadDashboardData = useCallback(async () => {
    if (!profile) return;

    try {
      if (profile.role === "admin") {
        const storeId = profile.store_id || 1;
        
        const [prodData, orderData, salesData, cajaData] = await Promise.all([
          dbService.getProducts(storeId),
          dbService.getOrders(storeId),
          dbService.getSales(storeId),
          dbService.getCajaSession(storeId)
        ]);

        setProducts(prodData);
        setOrders(orderData);
        setSales(salesData);
        setCaja(cajaData);
      } else {
        const [orderData, addrData] = await Promise.all([
          dbService.getClientOrders(profile.id),
          dbService.getAddresses(profile.id)
        ]);
        setClientOrders(orderData);
        setClientAddresses(addrData);
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setLocalLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    if (!authLoading && profile) {
      void loadDashboardData();
    }
  }, [authLoading, loadDashboardData, profile]);

  // ==========================================
  // MANEJADORES ADMINISTRATIVOS
  // ==========================================
  
  // ABRIR CAJA
  const handleOpenCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !cajaBase) return;
    const storeId = profile.store_id || 1;
    const base = Number(cajaBase);
    
    if (isNaN(base) || base <= 0) {
      showToast("Monto base inválido", "error");
      return;
    }

    const updatedCaja = await dbService.openCaja(storeId, base);
    setCaja(updatedCaja);
    setCajaBase("");
    showToast(`Caja abierta con éxito. Saldo inicial: $${base.toLocaleString("es-CL")}`, "success");
    void loadDashboardData();
  };

  // CERRAR CAJA (sin confirm() nativo bloqueante)
  const handleCloseCaja = async () => {
    if (!profile) return;
    const storeId = profile.store_id || 1;
    const updatedCaja = await dbService.closeCaja(storeId);
    setCaja(updatedCaja);
    setShowCloseCajaConfirm(false);
    showToast("Caja cerrada y balance archivado con éxito", "info");
    void loadDashboardData();
  };

  // RETIRO DE DINERO DE CAJA
  const handleWithdrawCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !caja || !withdrawAmount || !withdrawDesc) return;
    const storeId = profile.store_id || 1;
    const amount = Number(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast("Monto de retiro inválido", "error");
      return;
    }

    if (amount > caja.currentAmount) {
      showToast("No hay suficiente dinero en caja para este retiro", "error");
      return;
    }

    const updatedCaja = await dbService.withdrawCaja(storeId, amount, withdrawDesc);
    setCaja(updatedCaja);
    setWithdrawAmount("");
    setWithdrawDesc("");
    setShowWithdrawForm(false);
    showToast(`Retiro registrado: $${amount.toLocaleString("es-CL")} descontados de caja`, "warning");
    void loadDashboardData();
  };

  // REGISTRAR VENTA PRESENCIAL (POS)
  const handleRegisterPOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !posAmount || !posDetails) return;
    const storeId = profile.store_id || 1;
    const amount = Number(posAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast("Monto de venta inválido", "error");
      return;
    }

    if (caja && !caja.isOpen) {
      showToast("Debes abrir la caja registradora antes de realizar una venta", "error");
      return;
    }

    await dbService.registerPresencialSale(storeId, amount, posDetails);
    setPosAmount("");
    setPosDetails("");
    showToast(`¡Venta presencial registrada por $${amount.toLocaleString("es-CL")}!`, "success");
    void loadDashboardData();
  };

  // ACTUALIZAR ESTADO DE PEDIDO EN LÍNEA
  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    await dbService.updateOrderStatus(orderId, status);
    showToast(`Pedido ${orderId} actualizado a: ${status}`, "success");
    void loadDashboardData();
  };

  // REPONER STOCK CRÍTICO DESDE EL DASHBOARD
  const handleReponerStock = async (prodId: number, currentStock: number) => {
    await dbService.updateProductStock(prodId, currentStock + 10);
    showToast("Stock abastecido (+10 unidades)", "success");
    void loadDashboardData();
  };

  // ==========================================
  // MANEJADORES CLIENTE
  // ==========================================
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !fullName || !phone || !city || !address) {
      showToast("Completa todos los campos de dirección", "error");
      return;
    }

    const addrData = {
      user_id: profile.id,
      full_name: fullName,
      phone,
      country: "Chile",
      city,
      address
    };

    await dbService.saveAddress(addrData);
    setFullName("");
    setPhone("");
    setCity("");
    setAddress("");
    showToast("Dirección guardada exitosamente", "success");
    void loadDashboardData();
  };

  if (authLoading || localLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando consola de DigitalMarket...</p>
      </main>
    );
  }

  // CALCULO DE MÉTRICAS ADMIN
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0);
  const activeOrdersCount = orders.filter((o) => o.status === "Pendiente" || o.status === "Preparando").length;
  const criticalStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const todaySalesAmount = sales
    .filter((s) => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      {/* GLOWS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* HEADER GENERAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white">
              {profile?.role === "admin" ? "📊 Consola de Administración" : "👤 Panel del Cliente"}
            </h1>
            <p className="text-gray-400 mt-2">
              {profile?.role === "admin"
                ? `Bienvenido de vuelta, ${profile.full_name || "Administrador"} • Almacén Don Tito`
                : `Gestiona tus pedidos y direcciones, ${profile?.full_name}`}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400 font-semibold">
              Servicio Comercial: <strong className="text-white">Conectado (Híbrido)</strong>
            </span>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* VISTA DEL DUEÑO DE ALMACÉN (ADMIN) */}
        {/* ================================================================================= */}
        {profile?.role === "admin" && (
          <div className="space-y-10">
            
            {/* 1. SECCIÓN DE MÉTRICAS COMERCIALES (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* KP1: VENTAS DE HOY */}
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)] transition duration-300">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Ventas de Hoy</p>
                <h3 className="text-3xl font-black text-white mt-2">${todaySalesAmount.toLocaleString("es-CL")}</h3>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-3">
                  ▲ +14.2% <span className="text-gray-500">vs ayer</span>
                </span>
              </div>

              {/* KP2: INGRESOS MENSUALES */}
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)] transition duration-300">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Ingresos Acumulados</p>
                <h3 className="text-3xl font-black text-white mt-2">${totalSalesAmount.toLocaleString("es-CL")}</h3>
                <span className="text-gray-400 text-xs mt-3 block">Consumo del mes corriente</span>
              </div>

              {/* KP3: PEDIDOS PENDIENTES */}
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)] transition duration-300">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pedidos por Despachar</p>
                <h3 className="text-3xl font-black text-cyan-400 mt-2">{activeOrdersCount} Activos</h3>
                <span className="text-gray-400 text-xs mt-3 block">Requieren preparación</span>
              </div>

              {/* KP4: ALERTAS STOCK */}
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.05)] transition duration-300">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Stock Crítico</p>
                <h3 className={`text-3xl font-black mt-2 ${criticalStockCount > 0 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {criticalStockCount} Alertas
                </h3>
                <span className="text-gray-400 text-xs mt-3 block">Productos bajo stock mínimo</span>
              </div>
            </div>

            {/* 2. CONTROL DE CAJA REGISTRADORA (ARQUEO DIARIO) */}
            <div className="bg-gradient-to-r from-cyan-950/20 to-black border border-cyan-500/20 rounded-[35px] p-6 md:p-8 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💵</span>
                  <div>
                    <h2 className="text-2xl font-black">Control de Caja Registradora</h2>
                    <p className="text-xs text-gray-400">Arqueo de dinero diario, retiros y flujo comercial</p>
                  </div>
                </div>
                
                {caja?.isOpen && (
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase">
                      ● Caja Abierta
                    </span>
                    {!showCloseCajaConfirm ? (
                      <button
                        onClick={() => setShowCloseCajaConfirm(true)}
                        className="bg-rose-950/60 border border-rose-500/30 hover:bg-rose-600 hover:text-white px-5 py-2 rounded-xl text-rose-400 text-xs font-black transition cursor-pointer"
                      >
                        Realizar Cierre de Caja
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-semibold">¿Confirmar cierre?</span>
                        <button
                          onClick={() => void handleCloseCaja()}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer"
                        >
                          Sí, cerrar
                        </button>
                        <button
                          onClick={() => setShowCloseCajaConfirm(false)}
                          className="bg-white/10 text-gray-300 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {caja && !caja.isOpen && (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase">
                    ● Caja Cerrada
                  </span>
                )}
              </div>

              {/* CONTENIDO SEGÚN ESTADO DE CAJA */}
              {!caja?.isOpen ? (
                <div className="py-6 text-center max-w-md mx-auto space-y-4">
                  <p className="text-gray-400 text-sm">
                    La caja registradora está actualmente cerrada. Abre la sesión del día ingresando el saldo inicial para comenzar a registrar ventas.
                  </p>
                  <form onSubmit={handleOpenCaja} className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Monto base (ej: 50000)"
                      value={cajaBase}
                      onChange={(e) => setCajaBase(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-cyan-400 text-black font-black px-6 py-3 rounded-xl hover:scale-[1.03] transition shrink-0 cursor-pointer"
                    >
                      Abrir Caja
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* METRICAS DE CAJA */}
                  <div className="space-y-4 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-400 text-xs font-bold uppercase">Saldo en Caja Actual</p>
                      <h3 className="text-4xl font-black text-cyan-400 mt-2">${caja.currentAmount.toLocaleString("es-CL")}</h3>
                    </div>
                    
                    <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Saldo Base de Apertura:</span>
                        <span>${caja.baseAmount.toLocaleString("es-CL")}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-400">Ingresos Totales Hoy:</span>
                        <span className="text-emerald-400">+${(caja.currentAmount - caja.baseAmount).toLocaleString("es-CL")}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                      className="w-full text-center border border-yellow-500/30 hover:border-yellow-500 bg-yellow-500/10 text-yellow-300 py-3 rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      {showWithdrawForm ? "Cancelar Retiro" : "⚠ Registrar Retiro / Gasto de Caja"}
                    </button>
                  </div>

                  {/* FORMULARIO DE RETIRO EXPANDIBLE */}
                  {showWithdrawForm ? (
                    <form onSubmit={handleWithdrawCaja} className="space-y-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                      <h3 className="font-bold text-yellow-300 text-sm">Registrar Retiro o Pago de Proveedor</h3>
                      <input
                        type="number"
                        placeholder="Monto a retirar ($)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-black/40 border border-yellow-500/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-yellow-400 text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Detalle (ej: Pago distribuidora Coca-Cola)"
                        value={withdrawDesc}
                        onChange={(e) => setWithdrawDesc(e.target.value)}
                        className="w-full bg-black/40 border border-yellow-500/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-yellow-400 text-white"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-yellow-500 text-black font-black py-2.5 rounded-xl text-xs hover:scale-[1.02] transition cursor-pointer"
                      >
                        Confirmar Retiro
                      </button>
                    </form>
                  ) : (
                    /* REGISTRO POS EXPRESS (VENTAS RAPIDAS DE MESON) */
                    <form onSubmit={handleRegisterPOS} className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h3 className="font-black text-cyan-400 text-sm flex items-center gap-2">
                        <span>⚡ POS Express</span>
                        <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full">Venta de Mesón</span>
                      </h3>
                      
                      <div className="space-y-3">
                        <input
                          type="number"
                          placeholder="Monto Venta ($) (ej: 4500)"
                          value={posAmount}
                          onChange={(e) => setPosAmount(e.target.value)}
                          className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-400 text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Detalle (ej: Pan y cecinas)"
                          value={posDetails}
                          onChange={(e) => setPosDetails(e.target.value)}
                          className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-400 text-white"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-400 text-black font-black py-2.5 rounded-xl text-xs hover:scale-[1.02] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        ➕ Registrar Venta Rápida
                      </button>
                    </form>
                  )}

                  {/* HISTORIAL RECIENTE DE CAJA */}
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Movimientos de Caja</h4>
                    <div className="space-y-2 flex-grow overflow-y-auto max-h-[140px] pr-2">
                      {caja.history.map((h, i) => (
                        <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                          <div>
                            <span className="text-gray-500 font-mono">{h.time}</span>
                            <p className="font-semibold text-gray-300">{h.description}</p>
                          </div>
                          <span className={`font-bold ${
                            h.type === "Apertura"
                              ? "text-cyan-400"
                              : h.type === "Retiro"
                              ? "text-yellow-400"
                              : h.type === "Cierre"
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}>
                            {h.type === "Retiro" ? "-" : "+"}${h.amount.toLocaleString("es-CL")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. LISTADO DE PEDIDOS ONLINE RECIBIDOS Y FEED DE CATEGORÍAS */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* SECCIÓN PEDIDOS (2/3 de ancho en lg) */}
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[35px] p-6 backdrop-blur-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-white">📦 Gestión de Pedidos Online</h3>
                  <span className="text-xs text-gray-400">Total recibidos: {orders.length}</span>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2">
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No se han recibido pedidos en línea hoy.</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3 relative hover:border-cyan-400/30 transition">
                        
                        {/* ID Y ESTADO */}
                        <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-white/5">
                          <div>
                            <span className="text-xs font-mono text-cyan-400 font-bold">{order.id}</span>
                            <h4 className="text-sm font-bold text-white">{order.customer_name}</h4>
                            <p className="text-[10px] text-gray-500">{new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString("es-CL")}</p>
                          </div>
                          
                          {/* BADGES DE ESTADO CON ACCIONES */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                              order.status === "Pendiente"
                                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                                : order.status === "Preparando"
                                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse"
                                : order.status === "Entregado"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            }`}>
                              {order.status}
                            </span>
                            
                            {/* BOTONES RÁPIDOS DE CAMBIO DE ESTADO */}
                            {order.status === "Pendiente" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "Preparando")}
                                className="bg-cyan-400 text-black text-[10px] font-black px-3 py-1 rounded-lg hover:scale-105 transition cursor-pointer"
                              >
                                Preparar ⚙️
                              </button>
                            )}
                            {order.status === "Preparando" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "Entregado")}
                                className="bg-emerald-400 text-black text-[10px] font-black px-3 py-1 rounded-lg hover:scale-105 transition cursor-pointer"
                              >
                                Entregar ✓
                              </button>
                            )}
                          </div>
                        </div>

                        {/* PRODUCTOS COMPRADOS */}
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                              <span>• {item.title} <strong className="text-gray-500">x{item.quantity}</strong></span>
                              <span>${(item.price * item.quantity).toLocaleString("es-CL")}</span>
                            </div>
                          ))}
                        </div>

                        {/* DESPACHO Y TOTAL */}
                        <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                          <p className="text-gray-500 truncate max-w-[250px]"><span className="font-bold">📍 Despacho:</span> {order.address}</p>
                          <p className="font-bold text-sm text-cyan-400">Total: ${order.total.toLocaleString("es-CL")}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* METRICAS GRAFICAS CSS Y STOCK ALERTA (1/3 de ancho) */}
              <div className="space-y-6">
                
                {/* GRAFICO VENTAS POR CATEGORIA */}
                <div className="bg-white/5 border border-white/10 rounded-[35px] p-6 backdrop-blur-2xl">
                  <h3 className="text-lg font-black mb-4">Ventas por Categoría</h3>
                  
                  <div className="space-y-4">
                    {/* ABARROTES */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Abarrotes</span>
                        <span className="font-bold">42%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: "42%" }} />
                      </div>
                    </div>
                    {/* BEBIDAS */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Bebidas y Líquidos</span>
                        <span className="font-bold">28%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "28%" }} />
                      </div>
                    </div>
                    {/* LACTEOS */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Pan y Lácteos</span>
                        <span className="font-bold">20%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: "20%" }} />
                      </div>
                    </div>
                    {/* SNACKS */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Snacks y Confites</span>
                        <span className="font-bold">10%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-full rounded-full" style={{ width: "10%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ABASTECIMIENTO RAPIDO DE INVENTARIO */}
                <div className="bg-white/5 border border-white/10 rounded-[35px] p-6 backdrop-blur-2xl">
                  <h3 className="text-lg font-black mb-3">Abastecimiento de Inventario</h3>
                  <p className="text-xs text-gray-500 mb-4">Repón productos críticos con un clic</p>
                  
                  <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2">
                    {products.map((p) => {
                      const isCritical = p.stock <= p.minStock;
                      return (
                        <div key={p.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                          <div className="max-w-[150px]">
                            <h4 className="text-xs font-bold truncate text-white">{p.title}</h4>
                            <span className={`text-[10px] font-bold ${isCritical ? "text-rose-400" : "text-emerald-400"}`}>
                              Stock: {p.stock} u. {isCritical && "⚠️"}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleReponerStock(p.id, p.stock)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                              isCritical
                                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            +10
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================================================================================= */}
        {/* VISTA DEL CLIENTE (DIRECCIONES Y COMPRAS) */}
        {/* ================================================================================= */}
        {profile?.role === "client" && (
          <div className="grid lg:grid-cols-2 gap-10">
            
            {/* IZQUIERDA: HISTORIAL DE PEDIDOS REALIZADOS */}
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-cyan-400 flex items-center gap-3">
                <span>📦</span> Mis Pedidos Realizados
              </h2>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                {clientOrders.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 text-center">
                    <p className="text-gray-400 mb-4">Aún no has realizado pedidos en línea.</p>
                    <a
                      href="/stores"
                      className="inline-block bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
                    >
                      Ir a Comprar en Almacenes
                    </a>
                  </div>
                ) : (
                  clientOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-4 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2 border-b border-white/5 pb-3">
                        <div>
                          <span className="text-xs font-mono text-cyan-400 font-bold">{order.id}</span>
                          <p className="text-[10px] text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                          order.status === "Pendiente"
                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                            : order.status === "Preparando"
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse"
                            : order.status === "Entregado"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{item.title} <strong className="text-gray-500">x{item.quantity}</strong></span>
                            <span>${(item.price * item.quantity).toLocaleString("es-CL")}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs">
                        <span className="text-gray-500 truncate max-w-[200px]">📍 {order.address}</span>
                        <span className="font-bold text-sm text-cyan-400">Total: ${order.total.toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DERECHA: GESTIÓN DE DIRECCIONES DE ENVÍO */}
            <div className="space-y-8">
              
              {/* FORMULARIO DIRECCIÓN */}
              <div className="bg-white/5 border border-white/10 rounded-[35px] p-6 backdrop-blur-2xl">
                <h2 className="text-2xl font-black text-white mb-6">➕ Nueva Dirección de Envío</h2>
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre del receptor (ej: Juan Pérez)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Teléfono móvil"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Ciudad (ej: Providencia)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white"
                    required
                  />
                  <textarea
                    placeholder="Calle, numeración, número de departamento/casa"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-4 text-sm outline-none focus:border-cyan-400 text-white h-24 resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 rounded-xl font-bold hover:scale-[1.02] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Guardar Nueva Dirección
                  </button>
                </form>
              </div>

              {/* LISTA DE DIRECCIONES */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">📍 Direcciones Guardadas</h2>
                {clientAddresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No has guardado direcciones de envío todavía.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {clientAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-1.5 relative hover:border-cyan-500/20 transition"
                      >
                        <h4 className="font-bold text-cyan-400 text-sm">{addr.full_name}</h4>
                        <p className="text-gray-400">📞 {addr.phone}</p>
                        <p className="text-gray-400">📍 {addr.address}, {addr.city}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}