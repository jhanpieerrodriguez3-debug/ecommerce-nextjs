import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white relative overflow-hidden">
      {/* BACKGROUND NEON GLOWS */}
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 blur-[130px] rounded-full top-[-100px] left-[-150px]" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full bottom-[-100px] right-[-150px]" />

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center">
        {/* HERO TEXT */}
        <div className="space-y-8 text-left">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-full text-cyan-300 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.15)] animate-pulse">
            🚀 DIGITALMARKET • LA REVOLUCIÓN DEL BARRIO
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            Digitaliza tu <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Almacén de Barrio
            </span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
            Un sistema de gestión integral (SaaS) y punto de venta (POS) express con control de caja registradora, inventario en tiempo real y catálogo e-commerce para tus vecinos.
          </p>

          {/* DUAL ROLE ENTRY BUTTONS (WOW FACTOR FOR EVALUATION) */}
          <div className="space-y-4 pt-4">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">🎯 Acceso Rápido para Evaluadores:</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="flex-1 text-center bg-gradient-to-r from-cyan-400 to-blue-600 py-4 px-6 rounded-2xl text-base font-black shadow-[0_4px_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98] transition duration-300 flex items-center justify-center gap-2"
              >
                ⚙️ Consola Dueño (Admin)
              </Link>

              <Link
                href="/login"
                className="flex-1 text-center bg-white/5 border border-cyan-500/30 text-cyan-300 py-4 px-6 rounded-2xl text-base font-black hover:bg-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] transition duration-300 flex items-center justify-center gap-2"
              >
                🛒 Explorar como Cliente
              </Link>
            </div>
            <p className="text-[10px] text-gray-500">
              * Usa las credenciales de demostración pre-configuradas en la pantalla de inicio de sesión.
            </p>
          </div>
        </div>

        {/* HERO IMAGE */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-[90px] rounded-full" />
          
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop"
            alt="Dashboard DigitalMarket"
            className="relative rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10 group-hover:scale-102 transition duration-500"
          />

          <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-xl border border-cyan-500/30 p-5 rounded-3xl shadow-2xl flex items-center gap-3 max-w-[240px]">
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="font-bold text-xs text-white">Ventas del Almacén</h3>
              <p className="text-[10px] text-emerald-400 font-bold">▲ +28% esta semana</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (SAAS ORIENTED) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-28 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-black">Una Solución SaaS Hecha para Almaceneros</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">Herramientas profesionales simplificadas para impulsar el comercio de barrio local.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* FEATURE 1 */}
          <div className="bg-white/5 border border-white/10 rounded-[35px] p-8 hover:border-cyan-400/30 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-6">💵</div>
              <h3 className="text-xl font-black mb-3">Arqueo y Flujo de Caja</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Controla la caja registradora de tu negocio. Registra retiros de efectivo, egresos de proveedores y cuadra el balance diario en tiempo real.
              </p>
            </div>
          </div>

          {/* FEATURE 2 */}
          <div className="bg-white/5 border border-white/10 rounded-[35px] p-8 hover:border-cyan-400/30 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-6">📦</div>
              <h3 className="text-xl font-black mb-3">Semáforo de Inventario</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Visualiza el stock de seguridad. Recibe alertas visuales automáticas cuando un artículo alcance un stock crítico para abastecerte al instante.
              </p>
            </div>
          </div>

          {/* FEATURE 3 */}
          <div className="bg-white/5 border border-white/10 rounded-[35px] p-8 hover:border-cyan-400/30 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-6">🛍️</div>
              <h3 className="text-xl font-black mb-3">E-Commerce Autogestionado</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tus vecinos podrán explorar tu inventario online, añadir artículos al carro y realizar pedidos desde la comodidad de sus hogares.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}