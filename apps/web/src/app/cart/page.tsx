"use client";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
  } = useCart();

  const total =
    cart.reduce(
      (
        acc,
        item
      ) =>
        acc +
        item.price,
      0
    );

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-6xl font-black mb-4">
            🛒 Carrito
          </h1>

          <p className="text-gray-400 text-xl">
            Administra tus productos seleccionados
          </p>
        </div>

        {/* EMPTY */}
        {cart.length ===
        0 ? (
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-16 text-center shadow-[0_0_40px_rgba(34,211,238,0.15)]">
            <h2 className="text-4xl font-black mb-4">
              Tu carrito está vacío
            </h2>

            <p className="text-gray-400 text-lg">
              Agrega productos para comenzar tu compra
            </p>
          </div>
        ) : (
          <>
            {/* GRID */}
            <div className="grid gap-8 mb-10">
              {cart.map(
                (
                  product,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-6 flex flex-col md:flex-row gap-6 items-center shadow-[0_0_40px_rgba(34,211,238,0.15)]"
                  >
                    {/* IMAGE */}
                    <img
                      src={
                        product.image
                      }
                      alt={
                        product.title
                      }
                      className="w-full md:w-[220px] h-[220px] object-cover rounded-2xl"
                    />

                    {/* INFO */}
                    <div className="flex-1">
                      <h2 className="text-4xl font-black mb-4">
                        {
                          product.title
                        }
                      </h2>

                      <p className="text-cyan-400 text-3xl font-bold mb-6">
                        $
                        {
                          product.price
                        }
                      </p>

                      <button
                        onClick={() =>
                          removeFromCart(
                            index
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 transition px-6 py-3 rounded-2xl text-lg font-bold shadow-xl"
                      >
                        Eliminar producto
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* TOTAL */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 rounded-[30px] p-10 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-gray-400 text-lg">
                    Total a pagar
                  </p>

                  <h2 className="text-6xl font-black text-cyan-400">
                    $
                    {total}
                  </h2>
                </div>

                <div className="flex gap-5">
                  <button
                    onClick={
                      clearCart
                    }
                    className="bg-red-600 hover:bg-red-700 transition px-8 py-4 rounded-2xl text-lg font-bold shadow-xl"
                  >
                    Vaciar carrito
                  </button>

                  <button className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition duration-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    Finalizar compra
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}