"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export default function CartPage() {
  // Proteger ruta
  const { loading: authLoading } = useAuthGuard("client");
  const router = useRouter();
  const { showToast } = useToast();

  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart();

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleCheckoutRedirect = () => {
    if (cart.length === 0) {
      showToast("Tu carrito está vacío", "error");
      return;
    }
    router.push("/checkout");
  };

  const handleClearCart = () => {
    clearCart();
    showToast("Carrito vaciado correctamente", "info");
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando carrito de compras...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white relative overflow-hidden p-6 md:p-10">
      {/* BACKGROUND */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[140px] rounded-full top-[-150px] left-[-150px]" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/5 blur-[140px] rounded-full bottom-[-150px] right-[-150px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="pb-6 border-b border-white/10">
          <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs">• Pedido Online</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-2">
            🛒 Tu Pedido Comercial
          </h1>
          <p className="text-gray-400 mt-2">
            Revisa los abarrotes seleccionados antes de proceder a la facturación
          </p>
        </div>

        {/* EMPTY STATE */}
        {cart.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-[35px] p-16 text-center backdrop-blur-2xl max-w-2xl mx-auto space-y-6 shadow-[0_15px_45px_rgba(0,0,0,0.4)]">
            <span className="text-6xl block">🛒</span>
            <h2 className="text-3xl font-black text-white">Tu carrito está vacío</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
              Explora nuestra red de almacenes locales para abastecer tu despensa y realizar pedidos rápidos a domicilio.
            </p>
            <Link
              href="/stores"
              className="inline-block bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-3.5 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105 transition cursor-pointer"
            >
              Explorar Almacenes de Barrio
            </Link>
          </div>
        ) : (
          /* CONTENT */
          <div className="grid lg:grid-cols-3 gap-10">
            {/* PRODUCTS LIST */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[30px] p-6 shadow-[0_0_30px_rgba(34,211,238,0.05)] hover:border-cyan-400/20 transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* IMAGE */}
                    <div className="relative w-full sm:w-[180px] h-[180px] rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-black/40">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>

                    {/* INFO */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h2 className="text-2xl font-black text-white leading-snug">
                          {item.title}
                        </h2>

                        <p className="text-cyan-400 text-2xl font-black mt-2">
                          ${item.price.toLocaleString("es-CL")}
                        </p>
                      </div>

                      {/* CONTROLS */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                        {/* QUANTITY */}
                        <div className="flex items-center bg-black/40 border border-cyan-500/20 rounded-xl overflow-hidden">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            disabled={item.quantity <= 1}
                            className="w-11 h-11 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-bold"
                          >
                            –
                          </button>

                          <div className="w-12 text-center text-lg font-black text-white">
                            {item.quantity}
                          </div>

                          <button
                            onClick={() => increaseQuantity(item.id)}
                            className="w-11 h-11 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-300 font-bold transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* REMOVE */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/20 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl font-bold text-red-400 text-xs transition cursor-pointer"
                        >
                          Eliminar 🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BILLING RESUMEN PANEL */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[35px] p-6 md:p-8 h-fit sticky top-28 shadow-[0_0_40px_rgba(0,0,0,0.3)] space-y-6">
              <h2 className="text-2xl font-black text-white">Resumen del Pedido</h2>

              <div className="border-b border-white/10 pb-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Productos seleccionados:</span>
                  <span className="text-white font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)} u.</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Envío Local:</span>
                  <span className="text-emerald-400 font-bold">Gratis</span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400 text-lg">Total</span>
                <span className="text-3xl md:text-4xl font-black text-cyan-400">
                  ${total.toLocaleString("es-CL")}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="space-y-4 pt-4">
                <button
                  onClick={handleCheckoutRedirect}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-base font-black shadow-[0_4px_15px_rgba(34,211,238,0.2)] hover:scale-[1.02] active:scale-[0.98] transition duration-300 cursor-pointer"
                >
                  Proceder al Pago 💳
                </button>

                <button
                  onClick={handleClearCart}
                  className="w-full bg-white/5 hover:bg-red-600 hover:text-white py-4 rounded-2xl text-base font-bold transition text-gray-400 cursor-pointer"
                >
                  Vaciar Carrito
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
