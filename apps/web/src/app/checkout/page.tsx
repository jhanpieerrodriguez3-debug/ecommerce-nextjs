
"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CreditCard,
  CheckCircle2,
  Smartphone,
  Wallet,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const router =
    useRouter();

  const {
    cart,
    clearCart,
  } = useCart();

  const [loading, setLoading] =
    useState(false);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Tarjeta");

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

  const handleCheckout =
    async () => {
      setLoading(true);

      setTimeout(() => {
        clearCart();

        router.push(
          "/success"
        );
      }, 2500);
    };

  return (
    <main className="min-h-screen bg-[#030712] text-white relative overflow-hidden">
      {/* EFFECTS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full top-[-150px] left-[-150px]" />

      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full bottom-[-150px] right-[-150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10">
        {/* FORM */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
          <h1 className="text-5xl font-black mb-10">
            Checkout
          </h1>

          {/* INPUTS */}
          <div className="space-y-6">
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none focus:border-cyan-400 transition"
            />

            <input
              type="text"
              placeholder="Dirección"
              className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none focus:border-cyan-400 transition"
            />

            <input
              type="text"
              placeholder="Teléfono"
              className="w-full bg-black/30 border border-cyan-500/20 rounded-2xl p-5 outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* PAYMENT */}
          <div className="mt-10">
            <h2 className="text-3xl font-black mb-6">
              Método de pago
            </h2>

            <div className="space-y-5">
              {/* CARD */}
              <button
                onClick={() =>
                  setPaymentMethod(
                    "Tarjeta"
                  )
                }
                className={`w-full p-6 rounded-3xl border flex items-center gap-5 transition ${
                  paymentMethod ===
                  "Tarjeta"
                    ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <CreditCard size={35} />

                <div className="text-left">
                  <h3 className="text-2xl font-bold">
                    Tarjeta
                  </h3>

                  <p className="text-gray-400">
                    Visa / Mastercard
                  </p>
                </div>
              </button>

              {/* PAYPAL */}
              <button
                onClick={() =>
                  setPaymentMethod(
                    "PayPal"
                  )
                }
                className={`w-full p-6 rounded-3xl border flex items-center gap-5 transition ${
                  paymentMethod ===
                  "PayPal"
                    ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Wallet size={35} />

                <div className="text-left">
                  <h3 className="text-2xl font-bold">
                    PayPal
                  </h3>

                  <p className="text-gray-400">
                    Pago rápido online
                  </p>
                </div>
              </button>

              {/* YAPE */}
              <button
                onClick={() =>
                  setPaymentMethod(
                    "Yape"
                  )
                }
                className={`w-full p-6 rounded-3xl border flex items-center gap-5 transition ${
                  paymentMethod ===
                  "Yape"
                    ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Smartphone size={35} />

                <div className="text-left">
                  <h3 className="text-2xl font-bold">
                    Yape
                  </h3>

                  <p className="text-gray-400">
                    Pago móvil
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_0_40px_rgba(34,211,238,0.08)] h-fit">
          <h2 className="text-4xl font-black mb-10">
            Resumen
          </h2>

          <div className="space-y-5">
            {cart.map(
              (
                item
              ) => (
                <div
                  key={
                    item.id
                  }
                  className="flex justify-between items-center border-b border-white/10 pb-5"
                >
                  <div>
                    <h3 className="text-2xl font-bold">
                      {
                        item.title
                      }
                    </h3>

                    <p className="text-gray-400">
                      x
                      {
                        item.quantity
                      }
                    </p>
                  </div>

                  <p className="text-cyan-400 text-2xl font-black">
                    $
                    {item.price *
                      item.quantity}
                  </p>
                </div>
              )
            )}
          </div>

          {/* TOTAL */}
          <div className="flex justify-between items-center mt-10">
            <span className="text-3xl font-black">
              Total
            </span>

            <span className="text-5xl font-black text-cyan-400">
              ${total}
            </span>
          </div>

          {/* BUTTON */}
          <button
            onClick={
              handleCheckout
            }
            disabled={loading}
            className="w-full mt-10 bg-gradient-to-r from-cyan-400 to-blue-600 py-6 rounded-3xl text-2xl font-black shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:scale-105 transition duration-300 flex items-center justify-center gap-4"
          >
            {loading ? (
              <>
                <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />

                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 />

                Confirmar compra
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

