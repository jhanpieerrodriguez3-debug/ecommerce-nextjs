
"use client";

import {
  useState,
} from "react";

import {
  CreditCard,
  Lock,
  User,
  Mail,
  MapPin,
} from "lucide-react";

export default function CheckoutPage() {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const handlePayment =
    async () => {
      setLoading(true);

      setTimeout(() => {
        setLoading(false);

        alert(
          "✅ Pago realizado correctamente"
        );
      }, 2500);
    };

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
        {/* LEFT */}
        <div className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
          <h1 className="text-5xl font-black mb-4">
            💳 Checkout
          </h1>

          <p className="text-gray-400 mb-10">
            Completa tu información de pago
          </p>

          {/* NAME */}
          <div className="mb-6">
            <label className="block mb-3 font-bold">
              Nombre completo
            </label>

            <div className="flex items-center bg-black/30 border border-cyan-400/20 rounded-2xl px-4">
              <User className="text-cyan-400" />

              <input
                type="text"
                placeholder="Juan Pérez"
                className="w-full bg-transparent p-4 outline-none"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="mb-6">
            <label className="block mb-3 font-bold">
              Correo
            </label>

            <div className="flex items-center bg-black/30 border border-cyan-400/20 rounded-2xl px-4">
              <Mail className="text-cyan-400" />

              <input
                type="email"
                placeholder="correo@gmail.com"
                className="w-full bg-transparent p-4 outline-none"
              />
            </div>
          </div>

          {/* ADDRESS */}
          <div className="mb-6">
            <label className="block mb-3 font-bold">
              Dirección
            </label>

            <div className="flex items-center bg-black/30 border border-cyan-400/20 rounded-2xl px-4">
              <MapPin className="text-cyan-400" />

              <input
                type="text"
                placeholder="Av. Principal 123"
                className="w-full bg-transparent p-4 outline-none"
              />
            </div>
          </div>

          {/* CARD */}
          <div className="mb-6">
            <label className="block mb-3 font-bold">
              Número de tarjeta
            </label>

            <div className="flex items-center bg-black/30 border border-cyan-400/20 rounded-2xl px-4">
              <CreditCard className="text-cyan-400" />

              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full bg-transparent p-4 outline-none"
              />
            </div>
          </div>

          {/* ROW */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            {/* DATE */}
            <div>
              <label className="block mb-3 font-bold">
                Expiración
              </label>

              <input
                type="text"
                placeholder="MM/YY"
                className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 outline-none"
              />
            </div>

            {/* CVV */}
            <div>
              <label className="block mb-3 font-bold">
                CVV
              </label>

              <input
                type="password"
                placeholder="123"
                className="w-full bg-black/30 border border-cyan-400/20 rounded-2xl p-4 outline-none"
              />
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={
              handlePayment
            }
            disabled={
              loading
            }
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-5 rounded-2xl text-xl font-black shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 transition duration-300"
          >
            {loading
              ? "Procesando pago..."
              : "Pagar ahora"}
          </button>
        </div>

        {/* RIGHT */}
        <div className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
          <h2 className="text-4xl font-black mb-8">
            🛍️ Resumen
          </h2>

          <div className="space-y-5 mb-10">
            <div className="flex justify-between">
              <span className="text-gray-400">
                Subtotal
              </span>

              <span className="font-bold">
                $120
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Envío
              </span>

              <span className="font-bold">
                $10
              </span>
            </div>

            <div className="border-t border-white/10 pt-5 flex justify-between text-2xl font-black">
              <span>Total</span>

              <span className="text-cyan-400">
                $130
              </span>
            </div>
          </div>

          {/* SECURITY */}
          <div className="bg-black/30 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Lock className="text-cyan-400" />
            </div>

            <div>
              <h3 className="font-bold text-xl">
                Pago seguro
              </h3>

              <p className="text-gray-400 text-sm">
                Tus datos están protegidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

