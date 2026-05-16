"use client";

import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { cart } =
    useCart();

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
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            💳 Checkout
          </h1>

          <p className="text-gray-400 text-xl">
            Finaliza tu compra
          </p>
        </div>

        {/* RESUMEN */}
        <div className="bg-white/10 border border-white/10 rounded-[30px] p-10 mb-10">
          <h2 className="text-3xl font-black mb-8 text-cyan-400">
            Resumen del pedido
          </h2>

          <div className="space-y-5">
            {cart.map(
              (
                product,
                index
              ) => (
                <div
                  key={index}
                  className="flex justify-between border-b border-white/10 pb-4"
                >
                  <p className="text-xl">
                    {
                      product.title
                    }
                  </p>

                  <p className="text-cyan-400 font-bold text-xl">
                    $
                    {
                      product.price
                    }
                  </p>
                </div>
              )
            )}
          </div>

          {/* TOTAL */}
          <div className="flex justify-between items-center mt-10">
            <h3 className="text-4xl font-black">
              Total:
            </h3>

            <p className="text-5xl font-black text-cyan-400">
              ${total}
            </p>
          </div>
        </div>

        {/* PAGOS */}
        <div className="bg-white/10 border border-white/10 rounded-[30px] p-10">
          <h2 className="text-3xl font-black mb-8 text-cyan-400">
            Método de pago
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* TARJETA */}
            <button className="bg-black/30 border border-cyan-400/20 rounded-2xl p-8 hover:border-cyan-400 transition text-left">
              <h3 className="text-2xl font-black mb-3">
                💳 Tarjeta
              </h3>

              <p className="text-gray-400">
                Visa / Mastercard
              </p>
            </button>

            {/* PAYPAL */}
            <button className="bg-black/30 border border-cyan-400/20 rounded-2xl p-8 hover:border-cyan-400 transition text-left">
              <h3 className="text-2xl font-black mb-3">
                🅿️ PayPal
              </h3>

              <p className="text-gray-400">
                Pago online seguro
              </p>
            </button>

            {/* YAPE */}
            <button className="bg-black/30 border border-cyan-400/20 rounded-2xl p-8 hover:border-cyan-400 transition text-left">
              <h3 className="text-2xl font-black mb-3">
                📱 Yape
              </h3>

              <p className="text-gray-400">
                Pago rápido móvil
              </p>
            </button>

            {/* STRIPE */}
            <button className="bg-black/30 border border-cyan-400/20 rounded-2xl p-8 hover:border-cyan-400 transition text-left">
              <h3 className="text-2xl font-black mb-3">
                ⚡ Stripe
              </h3>

              <p className="text-gray-400">
                Checkout moderno
              </p>
            </button>
          </div>

          {/* FINALIZAR */}
          <button className="w-full mt-10 bg-gradient-to-r from-cyan-400 to-blue-600 py-5 rounded-2xl text-2xl font-black hover:scale-[1.02] transition">
            Finalizar compra
          </button>
        </div>
      </div>
    </main>
  );
}