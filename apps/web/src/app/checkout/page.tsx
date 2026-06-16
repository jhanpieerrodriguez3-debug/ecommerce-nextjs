"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock, User, Mail, MapPin } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { dbService, Order } from "@/lib/dbService";

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Proteger ruta con rol client
  const { loading: authLoading, profile } = useAuthGuard("client");
  
  const { cart, total: cartTotal, clearCart } = useCart();

  // Estados de Formulario de Pago
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Selección de tipo de entrega y método de pago
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "tienda">("online");

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && profile) {
      setName(profile.full_name || "");
      setEmail(profile.email || "");
      
      // Cargar direcciones guardadas del cliente
      const fetchAddresses = async () => {
        const addr = await dbService.getAddresses(profile.id);
        setSavedAddresses(addr);
        if (addr.length > 0) {
          setAddress(addr[0].address); // auto-seleccionar la primera
        }
      };
      void fetchAddresses();
    }
  }, [authLoading, profile]);

  const handleSelectSavedAddress = (addrText: string) => {
    setAddress(addrText);
    showToast("Dirección de envío aplicada", "info");
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || cart.length === 0) return;

    if (!name || !email) {
      showToast("Por favor, ingresa tu nombre y correo", "error");
      return;
    }

    if (deliveryType === "delivery" && !address) {
      showToast("Por favor, ingresa tu dirección de despacho", "error");
      return;
    }

    if (paymentMethod === "online" && (!cardNumber || !expiry || !cvv)) {
      showToast("Por favor, completa la información de pago con tarjeta", "error");
      return;
    }

    setLoading(true);

    // Determinar la tienda asociada
    const storeId = cart[0]?.store_id || 1; 

    const orderItems = cart.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    }));

    const finalAddressText = deliveryType === "pickup" ? "Retiro en Almacén" : address;
    const finalBillingText = paymentMethod === "online" ? "Pago Online" : "Pagar en Tienda";
    const orderAddress = `${finalAddressText} (${finalBillingText})`;

    setTimeout(async () => {
      try {
        // Crear orden comercial real en dbService
        const createdOrder = await dbService.createOrder({
          store_id: storeId,
          user_id: profile.id,
          customer_name: name,
          customer_email: email,
          address: orderAddress,
          items: orderItems,
          total: cartTotal
        });

        setSuccessOrder(createdOrder);
        clearCart();
        showToast(
          paymentMethod === "online" 
            ? "¡Transacción autorizada y pedido registrado!" 
            : "¡Pedido registrado exitosamente para pagar en tienda!", 
          "success"
        );
      } catch (err) {
        showToast("Ocurrió un error al procesar el pedido", "error");
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando pasarela de pago segura...</p>
      </main>
    );
  }

  // SI LA COMPRA FUE EXITOSA: MOSTRAR RECIBO GLASSMORPHIC PREMIUM
  if (successOrder) {
    return (
      <main className="min-h-screen bg-[#050816] text-white py-16 px-6 relative overflow-hidden flex items-center justify-center">
        {/* GLOW */}
        <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
        
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-emerald-500/30 rounded-[40px] p-8 md:p-10 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-center relative z-10 space-y-6">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
            ✓
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white">¡Pedido Confirmado!</h1>
            <p className="text-gray-400 text-sm">Tu pedido ha sido enviado al almacén para su preparación inmediata.</p>
          </div>

          {/* RECIBO DIGITAL */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 text-left space-y-4 text-xs font-semibold">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-400">Código de Pedido:</span>
              <span className="text-cyan-400 font-mono font-bold text-sm">{successOrder.id}</span>
            </div>
            
            <div className="space-y-2">
              <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Detalle de Artículos:</span>
              {successOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-gray-300">
                  <span>{item.title} <strong className="text-gray-500">x{item.quantity}</strong></span>
                  <span>${(item.price * item.quantity).toLocaleString("es-CL")}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1.5 text-gray-300">
              <p>📍 <strong className="text-white">Opción / Dirección:</strong> {successOrder.address}</p>
              <p>📧 <strong className="text-white">Correo Confirmación:</strong> {successOrder.customer_email}</p>
            </div>

            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-sm">
              <span className="text-white font-bold">
                {successOrder.address.includes("Pagar en Tienda") || successOrder.address.includes("Pagar al Recibir") 
                  ? "Monto a Pagar al Recibir:" 
                  : "Total Cargado a Tarjeta:"}
              </span>
              <span className="text-lg font-black text-cyan-400">${successOrder.total.toLocaleString("es-CL")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl font-black hover:scale-[1.02] transition shadow-lg cursor-pointer"
            >
              📦 Seguir Pedido en Mi Cuenta
            </button>
            <button
              onClick={() => router.push("/stores")}
              className="px-6 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold transition text-gray-300 cursor-pointer"
            >
              Seguir Comprando
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      {/* GLOWS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* ENLACE VOLVER */}
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition">
          ← Volver al Carrito
        </button>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[35px] max-w-md mx-auto space-y-4">
            <p className="text-gray-400">No hay productos en el carrito para realizar facturación.</p>
            <button
              onClick={() => router.push("/stores")}
              className="bg-cyan-400 text-black font-black px-6 py-3 rounded-xl hover:scale-105 transition"
            >
              Ver Almacenes
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-10">
            
            {/* IZQUIERDA: FORMULARIO DE PAGO Y DIRECCIÓN (3/5 de ancho) */}
            <form onSubmit={handlePayment} className="lg:col-span-3 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[35px] p-6 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.08)] space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">🏪 Despacho y Pago</h1>
                <p className="text-gray-400 text-sm">Elige tu forma de entrega y método de pago preferido</p>
              </div>

              {/* TIPO DE ENTREGA Y METODO DE PAGO SELECTORS */}
              <div className="grid sm:grid-cols-2 gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
                {/* TIPO DE ENTREGA */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Entrega</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType("delivery");
                        if (savedAddresses.length > 0) {
                          setAddress(savedAddresses[0].address);
                        } else {
                          setAddress("");
                        }
                      }}
                      className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        deliveryType === "delivery"
                          ? "border-cyan-400 bg-cyan-400/10 text-white"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-lg">🚚</span>
                      <span>Despacho</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType("pickup");
                        setAddress("Retiro en Almacén");
                      }}
                      className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        deliveryType === "pickup"
                          ? "border-cyan-400 bg-cyan-400/10 text-white"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-lg">🏪</span>
                      <span>Retiro</span>
                    </button>
                  </div>
                </div>

                {/* METODO DE PAGO */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        paymentMethod === "online"
                          ? "border-cyan-400 bg-cyan-400/10 text-white"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-lg">💳</span>
                      <span>Pago Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("tienda")}
                      className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        paymentMethod === "tienda"
                          ? "border-cyan-400 bg-cyan-400/10 text-white"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="text-lg">💵</span>
                      <span>En Tienda</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NAME */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">Nombre del Receptor</label>
                <div className="flex items-center bg-black/40 border border-cyan-400/20 rounded-xl px-4">
                  <User size={18} className="text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent p-3 text-sm outline-none text-white"
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">Correo Confirmación</label>
                <div className="flex items-center bg-black/40 border border-cyan-400/20 rounded-xl px-4">
                  <Mail size={18} className="text-cyan-400" />
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent p-3 text-sm outline-none text-white"
                    required
                  />
                </div>
              </div>

              {/* ADDRESS & SAVED ADDRESSES (Conditional) */}
              {deliveryType === "delivery" && (
                <>
                  {/* SAVED ADDRESSES SELECTOR */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-gray-400 text-xs font-semibold">📍 Selecciona Dirección Guardada:</label>
                      <div className="flex flex-wrap gap-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr.address)}
                            className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition cursor-pointer ${
                              address === addr.address ? "border-cyan-400 bg-cyan-400/10 text-white" : "border-white/10 text-gray-400 hover:border-cyan-400/30"
                            }`}
                          >
                            {addr.full_name} ({addr.city})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ADDRESS INPUT */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-300">Dirección de Despacho Local</label>
                    <div className="flex items-center bg-black/40 border border-cyan-400/20 rounded-xl px-4">
                      <MapPin size={18} className="text-cyan-400" />
                      <input
                        type="text"
                        placeholder="Ej: Av. Las Condes 8900, Santiago"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-transparent p-3 text-sm outline-none text-white"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CARD DETAILS (Conditional) */}
              {paymentMethod === "online" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-300">Número de Tarjeta de Crédito/Débito</label>
                    <div className="flex items-center bg-black/40 border border-cyan-400/20 rounded-xl px-4">
                      <CreditCard size={18} className="text-cyan-400" />
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-transparent p-3 text-sm outline-none text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* DATE */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-300">Expiración</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-3 text-sm outline-none text-white text-center"
                        required
                      />
                    </div>
                    {/* CVV */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-300">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-400/20 rounded-xl p-3 text-sm outline-none text-white text-center"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-xl text-base font-black shadow-[0_4px_15px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98] transition duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    {paymentMethod === "online" ? "Autorizando transacciones bancarias..." : "Confirmando pedido comercial..."}
                  </>
                ) : (
                  paymentMethod === "online" ? "Autorizar Pago y Registrar Pedido ✓" : "Confirmar Pedido (Pagar en Almacén) ✓"
                )}
              </button>
            </form>

            {/* DERECHA: RESUMEN DE COMPRA DE ARTÍCULOS (2/5 de ancho) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* BILLING BOX */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[35px] p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.08)] space-y-6">
                <h2 className="text-2xl font-black text-white">Resumen Compra</h2>
                
                {/* ITEMS */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 border-b border-white/10 pb-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                      <span className="truncate max-w-[160px]">{item.title} <strong className="text-gray-500">x{item.quantity}</strong></span>
                      <span>${(item.price * item.quantity).toLocaleString("es-CL")}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-xs border-b border-white/10 pb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span>${cartTotal.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Costo Despacho Local:</span>
                    <span className="text-emerald-400 font-bold">Gratis</span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-cyan-400">${cartTotal.toLocaleString("es-CL")}</span>
                </div>
              </div>

              {/* SECURITY TIP CARD */}
              <div className="bg-black/40 border border-white/5 rounded-3xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Transacción 100% Encriptada</h3>
                  <p className="text-gray-500 text-[10px] leading-relaxed">DIGITALMARKET procesa transacciones bancarias cifradas con SSL de grado SaaS comercial.</p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </main>
  );
}
