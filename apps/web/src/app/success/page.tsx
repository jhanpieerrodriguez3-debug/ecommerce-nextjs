
import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#030712] flex items-center justify-center text-white relative overflow-hidden">
      {/* EFFECTS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[140px] rounded-full top-[-150px] left-[-150px]" />

      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full bottom-[-150px] right-[-150px]" />

      <div className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-20 text-center shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        <div className="text-8xl mb-8">
          ✅
        </div>

        <h1 className="text-6xl font-black mb-6 text-cyan-400">
          Compra exitosa
        </h1>

        <p className="text-2xl text-gray-300 mb-10">
          Gracias por comprar en nuestra tienda
        </p>

        <Link
          href="/stores"
          className="inline-block bg-gradient-to-r from-cyan-400 to-blue-600 px-10 py-5 rounded-3xl text-2xl font-black shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 transition"
        >
          Volver a tiendas
        </Link>
      </div>
    </main>
  );
}

