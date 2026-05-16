"use client";

import Image from "next/image";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
  } = useCart();

  // TOTAL
  const total =
    cart.reduce(
      (
        acc,
        product
      ) =>
        acc +
        product.price,
      0
    );

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            🛒 Carrito
          </h1>

          <p className="text-gray-400 text-xl">
            Productos agregados
            por el cliente
          </p>
        </div>

        {/* VACÍO */}
        {cart.length ===
          0 && (
          <div className="bg-white/10 border border-white/10 rounded-[30px] p-10 text-center">
            <h2 className="text-4xl font-black mb-4">
              Tu carrito está vacío
            </h2>

            <p className="text-gray-400">
              Agrega productos para
              comenzar a comprar
            </p>
          </div>
        )}

        {/* PRODUCTOS */}
        <div className="grid gap-8">
          {cart.map(
            (
              product,
              index
            ) => (
              <div
                key={index}
                className="bg-white/10 border border-white/10 rounded-[30px] p-6 flex items-center gap-6"
              >
                {/* IMAGE */}
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden">
                  <Image
                    src={
                      product.image
                    }
                    alt={
                      product.title
                    }
                    fill
                    className="object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="flex-1">
                  <h2 className="text-3xl font-black mb-3">
                    {
                      product.title
                    }
                  </h2>

                  <p className="text-cyan-400 text-2xl font-bold">
                    $
                    {
                      product.price
                    }
                  </p>
                </div>

                {/* DELETE */}
                <button
                  onClick={() =>
                    removeFromCart(
                      index
                    )
                  }
                  className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-2xl font-bold"
                >
                  Eliminar
                </button>
              </div>
            )
          )}
        </div>

        {/* TOTAL */}
        {cart.length >
          0 && (
          <div className="mt-14 bg-white/10 border border-white/10 rounded-[30px] p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black">
                Total:
              </h2>

              <p className="text-5xl font-black text-cyan-400">
                ${total}
              </p>
            </div>

            <div className="flex gap-5">
              {/* CLEAR */}
              <button
                onClick={
                  clearCart
                }
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-2xl text-lg font-bold"
              >
                Vaciar carrito
              </button>

              {/* BUY */}
              <button className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition">
                <a
  href="/checkout"
  className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition"
>
  Comprar ahora
</a>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}