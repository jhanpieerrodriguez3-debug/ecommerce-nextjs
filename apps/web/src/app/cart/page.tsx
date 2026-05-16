
"use client";

import Image from "next/image";

import {
  CreditCard,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart();

  const total =
    cart.reduce(
      (
        acc,
        item
      ) =>
        acc +
        item.price *
          item.quantity,
      0
    );

  return (
    <main className="min-h-screen bg-[#030712] text-white relative overflow-hidden">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full top-[-150px] left-[-150px]" />

      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full bottom-[-150px] right-[-150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* HEADER */}
        <div className="mb-16">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.5)]">
              <ShoppingBag size={38} />
            </div>

            <div>
              <h1 className="text-6xl font-black">
                Mi Carrito
              </h1>

              <p className="text-gray-400 text-xl mt-2">
                Finaliza tu compra de forma segura
              </p>
            </div>
          </div>
        </div>

        {/* EMPTY */}
        {cart.length ===
          0 && (
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-20 text-center backdrop-blur-2xl">
            <h2 className="text-5xl font-black mb-4">
              🛒 Tu carrito está vacío
            </h2>

            <p className="text-gray-400 text-xl">
              Agrega productos desde la tienda
            </p>
          </div>
        )}

        {/* CONTENT */}
        <div className="grid lg:grid-cols-3 gap-10">
          {/* PRODUCTS */}
          <div className="lg:col-span-2 space-y-8">
            {cart.map(
              (item) => (
                <div
                  key={item.id}
                  className="group bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[35px] p-6 shadow-[0_0_40px_rgba(34,211,238,0.08)] hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] transition duration-500"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* IMAGE */}
                    <div className="relative w-full md:w-[240px] h-[240px] rounded-3xl overflow-hidden">
                      <Image
                        src={
                          item.image
                        }
                        alt={
                          item.title
                        }
                        fill
                        className="object-cover group-hover:scale-110 transition duration-500"
                      />
                    </div>

                    {/* INFO */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-4xl font-black mb-4">
                          {
                            item.title
                          }
                        </h2>

                        <p className="text-cyan-400 text-3xl font-black mb-6">
                          $
                          {
                            item.price
                          }
                        </p>
                      </div>

                      {/* CONTROLS */}
                      <div className="flex flex-wrap items-center gap-5">
                        {/* QUANTITY */}
                        <div className="flex items-center bg-black/40 border border-cyan-500/20 rounded-2xl overflow-hidden">
                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                            className="w-14 h-14 flex items-center justify-center hover:bg-white/10 transition"
                          >
                            <Minus />
                          </button>

                          <div className="w-16 text-center text-2xl font-black">
                            {
                              item.quantity
                            }
                          </div>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                            className="w-14 h-14 flex items-center justify-center hover:bg-cyan-500 transition"
                          >
                            <Plus />
                          </button>
                        </div>

                        {/* REMOVE */}
                        <button
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="flex items-center gap-3 bg-red-600 hover:bg-red-700 px-6 py-4 rounded-2xl font-bold transition"
                        >
                          <Trash2 size={20} />

                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* PAYMENT PANEL */}
          {cart.length >
            0 && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[35px] p-8 h-fit sticky top-10 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
              <h2 className="text-4xl font-black mb-10">
                Resumen
              </h2>

              {/* TOTAL */}
              <div className="flex justify-between items-center mb-8">
                <span className="text-gray-400 text-xl">
                  Total
                </span>

                <span className="text-5xl font-black text-cyan-400">
                  ${total}
                </span>
              </div>

              {/* PAYMENT METHODS */}
              <div className="space-y-5 mb-10">
                <h3 className="text-2xl font-bold mb-4">
                  Método de pago
                </h3>

                <button className="w-full bg-black/40 border border-cyan-500/20 hover:border-cyan-400 py-5 rounded-2xl flex items-center justify-center gap-3 transition">
                  <CreditCard />

                  Tarjeta
                </button>

                <button className="w-full bg-black/40 border border-cyan-500/20 hover:border-cyan-400 py-5 rounded-2xl transition">
                  💳 PayPal
                </button>

                <button className="w-full bg-black/40 border border-cyan-500/20 hover:border-cyan-400 py-5 rounded-2xl transition">
                  📱 Yape
                </button>
              </div>

              {/* ACTIONS */}
              <div className="space-y-5">
                <button className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-5 rounded-2xl text-xl font-black shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 transition duration-300">
                  Proceder al pago
                </button>

                <button
                  onClick={
                    clearCart
                  }
                  className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl text-xl font-bold transition"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
