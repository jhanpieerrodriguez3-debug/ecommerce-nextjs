import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      {/* HERO */}
      <section className="relative">
        {/* EFECTOS */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500 opacity-20 blur-[120px]" />

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700 opacity-20 blur-[120px]" />

        <div className="max-w-7xl mx-auto px-10 py-32 grid grid-cols-1 md:grid-cols-2 items-center gap-20 relative z-10">
          {/* TEXTO */}
          <div>
            <p className="text-cyan-400 text-xl mb-5 font-semibold">
              Ecommerce Moderno
            </p>

            <h1 className="text-7xl font-black leading-tight mb-8">
              Compra productos
              <span className="text-cyan-400">
                {" "}
                premium
              </span>
              <br />
              en DigitalMarket
            </h1>

            <p className="text-gray-300 text-2xl mb-10 leading-relaxed">
              Plataforma ecommerce profesional
              desarrollada con Next.js,
              Tailwind CSS,
              TypeScript
              y Supabase.
            </p>

            <div className="flex gap-5">
              <a
                href="/products"
                className="bg-cyan-400 text-black px-8 py-4 rounded-2xl text-xl font-bold shadow-2xl hover:scale-110 transition duration-300"
              >
                Comprar Ahora
              </a>

              <a
                href="/login"
                className="border border-cyan-400 px-8 py-4 rounded-2xl text-xl hover:bg-cyan-400 hover:text-black transition duration-300"
              >
                Login
              </a>
            </div>
          </div>

          {/* IMAGEN */}
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 blur-[100px] opacity-30 rounded-full" />

            <Image
              src="/hero.jpg"
              alt="Ecommerce"
              width={700}
              height={500}
              className="relative rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.5)] hover:scale-105 transition duration-500"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-10 py-24">
        <h2 className="text-5xl font-black text-center mb-20">
          ¿Por qué elegirnos?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl hover:-translate-y-5 transition duration-500">
            <h3 className="text-3xl font-bold text-cyan-400 mb-5">
              Productos Premium
            </h3>

            <p className="text-gray-300 text-lg leading-relaxed">
              Productos modernos y de alta calidad
              para clientes exigentes.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl hover:-translate-y-5 transition duration-500">
            <h3 className="text-3xl font-bold text-cyan-400 mb-5">
              Seguridad
            </h3>

            <p className="text-gray-300 text-lg leading-relaxed">
              Sistema protegido con autenticación
              y seguridad moderna.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl hover:-translate-y-5 transition duration-500">
            <h3 className="text-3xl font-bold text-cyan-400 mb-5">
              Envíos Rápidos
            </h3>

            <p className="text-gray-300 text-lg leading-relaxed">
              Experiencia rápida y moderna
              de compra online.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}