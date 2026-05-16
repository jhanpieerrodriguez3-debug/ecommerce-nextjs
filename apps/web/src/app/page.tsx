import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white relative overflow-hidden">
      {/* EFECTOS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <section className="relative z-10 max-w-7xl mx-auto px-10 py-24 grid lg:grid-cols-2 gap-20 items-center">
        {/* TEXTO */}
        <div>
          <p className="text-cyan-400 text-2xl font-bold mb-6">
            Ecommerce Moderno
          </p>

          <h1 className="text-7xl font-black leading-tight mb-8">
            Compra productos
            <span className="text-cyan-400">
              {" "}
              frescos
            </span>
            <br />
            para tu hogar
          </h1>

          <p className="text-gray-300 text-2xl leading-relaxed mb-10">
            Encuentra productos comestibles,
            bebidas, snacks y más desde
            nuestra tienda online profesional.
          </p>

          {/* BOTONES */}
          <div className="flex gap-5">
            <Link
              href="/login"
              className="bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition duration-300 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="border border-cyan-400 text-cyan-400 px-8 py-4 rounded-2xl text-xl font-bold hover:bg-cyan-400 hover:text-black transition duration-300"
            >
              Register
            </Link>
          </div>
        </div>

        {/* IMAGEN */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-[80px] rounded-full" />

          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop"
            alt="Tienda"
            className="relative rounded-[40px] shadow-[0_0_50px_rgba(34,211,238,0.4)] border border-cyan-400/20"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-10 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD 1 */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-8 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <div className="text-5xl mb-5">
              🥦
            </div>

            <h2 className="text-3xl font-black mb-4">
              Productos Frescos
            </h2>

            <p className="text-gray-400 text-lg">
              Compra productos de calidad
              para tu hogar.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-8 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <div className="text-5xl mb-5">
              🚚
            </div>

            <h2 className="text-3xl font-black mb-4">
              Delivery Rápido
            </h2>

            <p className="text-gray-400 text-lg">
              Entregas rápidas y seguras.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-8 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <div className="text-5xl mb-5">
              💳
            </div>

            <h2 className="text-3xl font-black mb-4">
              Pagos Seguros
            </h2>

            <p className="text-gray-400 text-lg">
              Métodos de pago rápidos y
              protegidos.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}